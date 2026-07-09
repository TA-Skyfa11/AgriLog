const fs = require('fs');

let content = fs.readFileSync('src/app/page.tsx', 'utf8');

// Add 'use client' and imports
if (!content.includes("'use client'")) {
  content = "'use client';\n" + content;
}

if (!content.includes("import { useState, useEffect } from 'react';")) {
  content = content.replace("import React from 'react';", "import React, { useState, useEffect } from 'react';");
}

if (!content.includes("import { fetchAPI } from '@/lib/api';")) {
  content = content.replace("import styles from '@/css/landing.module.css';", "import styles from '@/css/landing.module.css';\nimport { fetchAPI } from '@/lib/api';");
}

// Add state and fetch logic inside component
if (!content.includes("const [packages, setPackages]")) {
  const componentStart = content.indexOf('export default function LandingPage() {') + 'export default function LandingPage() {'.length;
  const logic = `
  const [packages, setPackages] = useState<any[]>([]);
  useEffect(() => {
    const loadPackages = async () => {
      try {
        const res = await fetchAPI('/services');
        if (res.success) {
          setPackages(res.data);
        }
      } catch (err) {}
    };
    loadPackages();
  }, []);
`;
  content = content.slice(0, componentStart) + logic + content.slice(componentStart);
}

// Replace pricing section
const pricingRegex = /<div className={styles.pricingCards}>([\s\S]*?)<\/section>/;

const newPricing = `<div className={styles.pricingCards}>
          {packages.length === 0 ? (
            <div style={{ textAlign: 'center', width: '100%', padding: '2rem' }}>Đang tải bảng giá...</div>
          ) : (
            packages.map((pkg) => (
              <div key={pkg._id} className={\`\${styles.pricingCard} \${pkg.code === 'STANDARD' ? styles.popular : ''}\`}>
                {pkg.code === 'STANDARD' && <div className={styles.popularBadge}>PHỔ BIẾN NHẤT</div>}
                <div className={styles.planName}>{pkg.name}</div>
                <div className={styles.planDesc}>{pkg.description}</div>
                <div className={styles.planPrice}>
                  {pkg.price === 0 ? 'Liên hệ' : pkg.price.toLocaleString('vi-VN')} <span>/ tháng</span>
                </div>
                <ul className={styles.planFeatures}>
                  {pkg.features && pkg.features.map((feature: string, idx: number) => (
                    <li key={idx}><span className={styles.featureCheck}>✓</span> {feature}</li>
                  ))}
                </ul>
                <Link href="/register" style={{ textDecoration: 'none' }}>
                  <button className={\`\${styles.planBtn} \${pkg.code === 'STANDARD' ? styles.filled : styles.outline}\`}>
                    Đăng ký ngay
                  </button>
                </Link>
              </div>
            ))
          )}
        </div>
      </section>`;

content = content.replace(pricingRegex, newPricing);

fs.writeFileSync('src/app/page.tsx', content);
console.log('Updated landing page with dynamic packages');
