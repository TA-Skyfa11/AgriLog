import { connectDB, getSql } from '../config/db';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Task } from '../models/Task';
import { SystemFeature } from '../models/SystemFeature';
import { SupabaseSessionStore } from '../config/supabaseSessionStore';

interface BenchmarkMetric {
  name: string;
  operations: number;
  totalTimeMs: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  opsPerSec: number;
}

const metrics: BenchmarkMetric[] = [];

function calculateStats(latencies: number[]): { avg: number; p95: number } {
  latencies.sort((a, b) => a - b);
  const sum = latencies.reduce((acc, curr) => acc + curr, 0);
  const avg = Number((sum / latencies.length).toFixed(2));
  const p95Index = Math.floor(latencies.length * 0.95);
  const p95 = Number(latencies[Math.min(p95Index, latencies.length - 1)].toFixed(2));
  return { avg, p95 };
}

async function runBenchmark() {
  console.log('===============================================================');
  console.log('⚡ AGRILOG SUPABASE POSTGRESQL PERFORMANCE BENCHMARK SUITE ⚡');
  console.log('===============================================================\n');

  // 1. Connection & Initial Handshake
  console.log('📡 [1/7] Testing Connection Handshake...');
  const t0 = performance.now();
  await connectDB();
  const connTime = performance.now() - t0;
  console.log(`  ✓ Database connected in ${connTime.toFixed(2)} ms\n`);

  const sql = getSql();

  // 2. Direct Raw SQL Ping Latency (Round Trip Time)
  console.log('⏱️ [2/7] Benchmarking Raw SQL Ping (50 iterations)...');
  const pingLatencies: number[] = [];
  for (let i = 0; i < 50; i++) {
    const s = performance.now();
    await sql`SELECT 1 as ping`;
    pingLatencies.push(performance.now() - s);
  }
  const pingStats = calculateStats(pingLatencies);
  const pingTotal = pingLatencies.reduce((a, b) => a + b, 0);
  metrics.push({
    name: 'Raw SQL Ping (RTT)',
    operations: 50,
    totalTimeMs: Number(pingTotal.toFixed(2)),
    avgLatencyMs: pingStats.avg,
    p95LatencyMs: pingStats.p95,
    opsPerSec: Number((50 / (pingTotal / 1000)).toFixed(1))
  });
  console.log(`  ✓ Avg: ${pingStats.avg} ms | p95: ${pingStats.p95} ms | Throughput: ${(50 / (pingTotal / 1000)).toFixed(1)} ops/s\n`);

  // 3. Single Record Insert Benchmark
  console.log('💾 [3/7] Benchmarking Single Record Inserts (Task model - 25 records)...');
  await sql.unsafe(`DELETE FROM tasks WHERE data->>'title' LIKE 'Benchmark Task%'`);
  const insertLatencies: number[] = [];
  const createdTaskIds: string[] = [];
  for (let i = 0; i < 25; i++) {
    const s = performance.now();
    const task = await Task.create({
      farmProfileId: '66f000000000000000000001',
      title: `Benchmark Task #${i + 1}`,
      description: `Performance measurement task test item ${i}`,
      status: 'pending',
      priority: 'medium',
      dueDate: new Date(Date.now() + 86400000 * (i + 1))
    });
    insertLatencies.push(performance.now() - s);
    createdTaskIds.push(task._id.toString());
  }
  const insertStats = calculateStats(insertLatencies);
  const insertTotal = insertLatencies.reduce((a, b) => a + b, 0);
  metrics.push({
    name: 'Single Insert (ORM/Model)',
    operations: 25,
    totalTimeMs: Number(insertTotal.toFixed(2)),
    avgLatencyMs: insertStats.avg,
    p95LatencyMs: insertStats.p95,
    opsPerSec: Number((25 / (insertTotal / 1000)).toFixed(1))
  });
  console.log(`  ✓ Avg: ${insertStats.avg} ms | p95: ${insertStats.p95} ms | Throughput: ${(25 / (insertTotal / 1000)).toFixed(1)} ops/s\n`);

  // 4. Primary Key & Indexed Queries
  console.log('🔍 [4/7] Benchmarking Indexed Lookups (findById & findOne - 50 iterations)...');
  const readLatencies: number[] = [];
  for (let i = 0; i < 50; i++) {
    const targetId = createdTaskIds[i % createdTaskIds.length];
    const s = performance.now();
    await Task.findById(targetId);
    readLatencies.push(performance.now() - s);
  }
  const readStats = calculateStats(readLatencies);
  const readTotal = readLatencies.reduce((a, b) => a + b, 0);
  metrics.push({
    name: 'Indexed Read (findById)',
    operations: 50,
    totalTimeMs: Number(readTotal.toFixed(2)),
    avgLatencyMs: readStats.avg,
    p95LatencyMs: readStats.p95,
    opsPerSec: Number((50 / (readTotal / 1000)).toFixed(1))
  });
  console.log(`  ✓ Avg: ${readStats.avg} ms | p95: ${readStats.p95} ms | Throughput: ${(50 / (readTotal / 1000)).toFixed(1)} ops/s\n`);

  // 5. Complex Chained Query (Filter + Sort + Limit + Skip)
  console.log('📊 [5/7] Benchmarking Chained Queries (Filter + Sort + Pagination - 25 iterations)...');
  const queryLatencies: number[] = [];
  for (let i = 0; i < 25; i++) {
    const s = performance.now();
    await Task.find({ farmProfileId: '66f000000000000000000001', status: 'pending' })
      .sort({ createdAt: -1 })
      .skip(5)
      .limit(10)
      .lean();
    queryLatencies.push(performance.now() - s);
  }
  const queryStats = calculateStats(queryLatencies);
  const queryTotal = queryLatencies.reduce((a, b) => a + b, 0);
  metrics.push({
    name: 'Chained Query (Sort/Page/Filter)',
    operations: 25,
    totalTimeMs: Number(queryTotal.toFixed(2)),
    avgLatencyMs: queryStats.avg,
    p95LatencyMs: queryStats.p95,
    opsPerSec: Number((25 / (queryTotal / 1000)).toFixed(1))
  });
  console.log(`  ✓ Avg: ${queryStats.avg} ms | p95: ${queryStats.p95} ms | Throughput: ${(25 / (queryTotal / 1000)).toFixed(1)} ops/s\n`);

  // 6. Concurrency Stress Test (15 parallel operations)
  console.log('⚡ [6/7] Benchmarking Concurrent Read/Write Workload (15 parallel operations)...');
  const concStart = performance.now();
  const promises = createdTaskIds.slice(0, 15).map((id, idx) => {
    return Task.findByIdAndUpdate(id, {
      $set: { status: 'completed', description: `Completed in stress benchmark ${idx}` }
    });
  });
  await Promise.all(promises);
  const concDuration = performance.now() - concStart;
  const concAvg = Number((concDuration / 15).toFixed(2));
  metrics.push({
    name: 'Concurrent Updates (15 parallel)',
    operations: 15,
    totalTimeMs: Number(concDuration.toFixed(2)),
    avgLatencyMs: concAvg,
    p95LatencyMs: Number(concDuration.toFixed(2)),
    opsPerSec: Number((15 / (concDuration / 1000)).toFixed(1))
  });
  console.log(`  ✓ 15 operations completed in: ${concDuration.toFixed(2)} ms | Throughput: ${(15 / (concDuration / 1000)).toFixed(1)} ops/s\n`);

  // 7. Express Session Store Benchmark
  console.log('🔑 [7/7] Benchmarking Supabase Session Store Operations (Set, Get, Destroy)...');
  const sessionStore = new SupabaseSessionStore();
  const sessLatencies: number[] = [];
  for (let i = 0; i < 15; i++) {
    const sid = `sess_bench_${i}_${Date.now()}`;
    const sessData = { cookie: { originalMaxAge: 86400000, expires: new Date(Date.now() + 86400000) }, user: { id: `u_${i}`, role: 'farmer' } } as any;
    
    // Set
    const s1 = performance.now();
    await new Promise<void>((resolve, reject) => sessionStore.set(sid, sessData, (err) => err ? reject(err) : resolve()));
    sessLatencies.push(performance.now() - s1);

    // Get
    const s2 = performance.now();
    await new Promise<any>((resolve, reject) => sessionStore.get(sid, (err, val) => err ? reject(err) : resolve(val)));
    sessLatencies.push(performance.now() - s2);

    // Destroy
    const s3 = performance.now();
    await new Promise<void>((resolve, reject) => sessionStore.destroy(sid, (err) => err ? reject(err) : resolve()));
    sessLatencies.push(performance.now() - s3);
  }
  const sessStats = calculateStats(sessLatencies);
  const sessTotal = sessLatencies.reduce((a, b) => a + b, 0);
  metrics.push({
    name: 'Session Store (Set/Get/Destroy)',
    operations: sessLatencies.length,
    totalTimeMs: Number(sessTotal.toFixed(2)),
    avgLatencyMs: sessStats.avg,
    p95LatencyMs: sessStats.p95,
    opsPerSec: Number((sessLatencies.length / (sessTotal / 1000)).toFixed(1))
  });
  console.log(`  ✓ Avg: ${sessStats.avg} ms | p95: ${sessStats.p95} ms | Throughput: ${(sessLatencies.length / (sessTotal / 1000)).toFixed(1)} ops/s\n`);

  // Cleanup benchmark tasks
  console.log('🧹 Cleaning up temporary benchmark tasks...');
  for (const id of createdTaskIds) {
    await Task.findByIdAndDelete(id);
  }
  console.log(`  ✓ Cleaned up ${createdTaskIds.length} benchmark task records.\n`);

  // Print Summary Table
  console.log('========================================================================================');
  console.log('🏁 BENCHMARK SUMMARY REPORT');
  console.log('========================================================================================');
  console.log('| Metric Name                      | Ops | Total Time (ms) | Avg Latency | p95 Latency | Throughput |');
  console.log('|----------------------------------|-----|-----------------|-------------|-------------|------------|');
  for (const m of metrics) {
    const name = m.name.padEnd(32);
    const ops = String(m.operations).padEnd(3);
    const tot = String(m.totalTimeMs).padEnd(15);
    const avg = `${m.avgLatencyMs} ms`.padEnd(11);
    const p95 = `${m.p95LatencyMs} ms`.padEnd(11);
    const opsSec = `${m.opsPerSec} ops/s`.padEnd(10);
    console.log(`| ${name} | ${ops} | ${tot} | ${avg} | ${p95} | ${opsSec} |`);
  }
  console.log('========================================================================================\n');
  console.log('🎉 All performance benchmarks completed successfully without errors!\n');
  process.exit(0);
}

runBenchmark().catch((err) => {
  console.error('❌ Benchmark error:', err);
  process.exit(1);
});
