import { createClient } from "@supabase/supabase-js";

const requiredEnv = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`Missing required env: ${key}`);
    process.exit(1);
  }
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const manualUsers = [
  {
    email: "local-admin@accredicore.local",
    password: "LocalAdmin123!",
    fullName: "Local Admin",
    role: "system_admin",
  },
  {
    email: "quality-manager@accredicore.local",
    password: "QualityManager123!",
    fullName: "Quality Manager",
    role: "admin",
  },
  {
    email: "dept-manager@accredicore.local",
    password: "DeptManager123!",
    fullName: "Department Manager",
    role: "admin",
  },
  {
    email: "team-leader@accredicore.local",
    password: "TeamLead123!",
    fullName: "Team Leader",
    role: "super_user",
  },
  {
    email: "staff-user@accredicore.local",
    password: "StaffUser123!",
    fullName: "Staff User",
    role: "user",
  },
];

async function ensureUser(definition) {
  const listResponse = await supabase.auth.admin.listUsers();
  if (listResponse.error) throw listResponse.error;

  let user = listResponse.data.users.find((item) => item.email === definition.email);

  if (!user) {
    const createResponse = await supabase.auth.admin.createUser({
      email: definition.email,
      password: definition.password,
      email_confirm: true,
      user_metadata: {
        full_name: definition.fullName,
      },
    });
    if (createResponse.error) throw createResponse.error;
    user = createResponse.data.user;
  } else {
    const updateResponse = await supabase.auth.admin.updateUserById(user.id, {
      password: definition.password,
      email_confirm: true,
      user_metadata: {
        ...(user.user_metadata || {}),
        full_name: definition.fullName,
      },
    });
    if (updateResponse.error) throw updateResponse.error;
    user = updateResponse.data.user;
  }

  const profileResponse = await supabase.from("profiles").upsert({
    id: user.id,
    email: definition.email,
    full_name: definition.fullName,
  });

  if (profileResponse.error) throw profileResponse.error;

  const deleteRoleResponse = await supabase
    .from("user_roles")
    .delete()
    .eq("user_id", user.id);

  if (deleteRoleResponse.error) throw deleteRoleResponse.error;

  const roleResponse = await supabase.from("user_roles").insert({
    user_id: user.id,
    role: definition.role,
  });

  if (roleResponse.error) throw roleResponse.error;

  return {
    id: user.id,
    email: user.email,
    role: definition.role,
    password: definition.password,
  };
}

async function main() {
  const results = [];
  for (const user of manualUsers) {
    results.push(await ensureUser(user));
  }

  console.log(JSON.stringify({ ok: true, users: results }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
