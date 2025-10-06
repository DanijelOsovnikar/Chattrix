#!/usr/bin/env node

const API_BASE = "http://localhost:3000/api";

async function makeRequest(
  endpoint,
  method = "GET",
  data = null,
  cookies = ""
) {
  const url = `${API_BASE}${endpoint}`;
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      Cookie: cookies,
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();

    return {
      status: response.status,
      data: result,
      cookies: response.headers.get("set-cookie") || "",
    };
  } catch (error) {
    console.error("Request failed:", error);
    return { status: 500, data: { error: error.message } };
  }
}

async function promoteUser() {
  // console.log("🔐 Starting user promotion process...\n");

  // Step 1: Login as Magacin (super_admin)
  // console.log("📝 Step 1: Logging in as Magacin...");

  const possiblePasswords = [
    "magacin",
    "Magacin",
    "123456",
    "password",
    "admin",
    "magacin123",
  ];
  let loginResponse;
  let cookies;

  for (const password of possiblePasswords) {
    // console.log(`🔑 Trying password: ${password}`);
    loginResponse = await makeRequest("/auth/login", "POST", {
      userName: "Magacin",
      password: password,
    });

    if (loginResponse.status === 200) {
      // console.log(`✅ Login successful with password: ${password}`);
      cookies = loginResponse.cookies;
      break;
    } else {
      // console.log(`❌ Failed with password: ${password}`);
    }
  }

  if (loginResponse.status !== 200) {
    console.error("❌ All login attempts failed:", loginResponse.data);
    // console.log("💡 Please provide the correct password for Magacin user");
    return;
  }

  // Step 2: Get all users to find "Test Danijel"
  // console.log("\n📋 Step 2: Fetching all users...");
  const usersResponse = await makeRequest("/users/admin", "GET", null, cookies);

  if (usersResponse.status !== 200) {
    console.error("❌ Failed to fetch users:", usersResponse.data);
    return;
  }

  const users = usersResponse.data;
  // console.log(`Found ${users.length} users`);

  // Find Test Danijel
  const testUser = users.find(
    (user) =>
      user.fullName.toLowerCase().includes("test") &&
      user.fullName.toLowerCase().includes("danijel")
  );

  if (!testUser) {
    console.error('❌ User "Test Danijel" not found');
    // console.log("Available users:");
    users.forEach((user) => {
      // console.log(`- ${user.fullName} (${user.username}) - ${user.role}`);
    });
    return;
  }

  // console.log(`✅ Found user: ${testUser.fullName} (${testUser.username})`);
  // console.log(`Current role: ${testUser.role}`);
  // console.log(`Current permissions: ${testUser.permissions.join(", ")}`);

  // Step 3: Promote to admin
  // console.log("\n🚀 Step 3: Promoting to admin role...");
  const updateResponse = await makeRequest(
    `/users/${testUser._id}`,
    "PATCH",
    {
      role: "admin",
    },
    cookies
  );

  if (updateResponse.status !== 200) {
    console.error("❌ Failed to update user:", updateResponse.data);
    return;
  }

  // console.log("✅ User successfully promoted to admin!");
  // console.log(`New role: ${updateResponse.data.user.role}`);
  // console.log(
  //   `New permissions: ${updateResponse.data.user.permissions.join(", ")}`
  // );

  // console.log('\n🎉 Promotion complete! "Test Danijel" now has admin access.');
}

// Run the script
promoteUser().catch(console.error);
