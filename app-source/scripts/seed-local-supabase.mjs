import { createClient } from "@supabase/supabase-js";

const requiredEnv = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "LOCAL_ADMIN_EMAIL",
  "LOCAL_ADMIN_PASSWORD",
  "LOCAL_ADMIN_NAME",
];

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

async function ensureAdminUser() {
  const email = process.env.LOCAL_ADMIN_EMAIL;
  const password = process.env.LOCAL_ADMIN_PASSWORD;
  const fullName = process.env.LOCAL_ADMIN_NAME;

  const listResponse = await supabase.auth.admin.listUsers();
  if (listResponse.error) {
    throw listResponse.error;
  }

  let user = listResponse.data.users.find((item) => item.email === email);

  if (!user) {
    const createResponse = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });
    if (createResponse.error) {
      throw createResponse.error;
    }
    user = createResponse.data.user;
  } else {
    const updateResponse = await supabase.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
      user_metadata: {
        ...(user.user_metadata || {}),
        full_name: fullName,
      },
    });
    if (updateResponse.error) {
      throw updateResponse.error;
    }
    user = updateResponse.data.user;
  }

  const roleResponse = await supabase
    .from("user_roles")
    .upsert(
      {
        user_id: user.id,
        role: "system_admin",
      },
      {
        onConflict: "user_id,role",
      }
    );

  if (roleResponse.error) {
    throw roleResponse.error;
  }

  const profileResponse = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      email,
      full_name: fullName,
    });

  if (profileResponse.error) {
    throw profileResponse.error;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        user: {
          id: user.id,
          email: user.email,
        },
      },
      null,
      2
    )
  );
}

ensureAdminUser().catch((error) => {
  console.error(error);
  process.exit(1);
});
