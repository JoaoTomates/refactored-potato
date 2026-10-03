import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://fivzbbqzgvvwgtlhietx.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpdnpiYnF6Z3Z2d2d0bGhpZXR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjczMjE0MiwiZXhwIjoyMDk4MzA4MTQyfQ.9qN4j9vkaI6kz2kyptG7QSdCLcQgpiFO6GwqasvNTQE',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function wipeAuthUsers() {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) {
        console.error("Error fetching users:", error);
        return;
    }
    console.log(`Found ${users.length} users to delete.`);
    for (const u of users) {
        const { error: delError } = await supabase.auth.admin.deleteUser(u.id);
        if (delError) {
            console.log(`Failed to delete ${u.email}:`, delError);
        } else {
            console.log(`Deleted ${u.email}`);
        }
    }
    console.log("Auth users wiped!");
}

wipeAuthUsers();
