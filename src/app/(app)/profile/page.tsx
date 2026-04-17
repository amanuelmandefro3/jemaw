import { getProfile } from "@/actions/profile";
import { ProfileForm } from "./profile-form";

export const metadata = { title: "Profile — Jemaw" };

export default async function ProfilePage() {
  const user = await getProfile();

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-6">Profile</h1>
      <ProfileForm user={user} />
    </div>
  );
}
