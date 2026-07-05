import { redirect } from 'next/navigation';
import styles from "@/css/page.module.css";

export default function Home() {
  redirect('/login');
}
