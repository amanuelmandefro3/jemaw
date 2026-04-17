import { getProfile } from "@/actions/profile";
import { ProfileForm } from "./profile-form";

export const metadata = { title: "Profile — Jemaw" };

export default async function ProfilePage() {
  const user = await getProfile();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your account settings</p>
      </div>
      <ProfileForm user={user} />
    </div>
  );
}
