import { isAdminAuthed } from "@/lib/auth";
import LoginForm from "./login-form";
import Dashboard from "./dashboard";

export const metadata = {
  title: "0&1 管理画面",
};

export default async function AdminPage() {
  const authed = await isAdminAuthed();

  return <main className="page admin-page">{authed ? <Dashboard /> : <LoginForm />}</main>;
}
