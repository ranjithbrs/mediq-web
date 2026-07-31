import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://vcycuilwoplwghxsplew.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjeWN1aWx3b3Bsd2doeHNwbGV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNzI2MDcsImV4cCI6MjA3ODk0ODYwN30.cR_ucFOIU2ZKkTEmXq1u38-i_-6gUE5Pn0tjcfJvEYU";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function test() {
  console.log("Querying pg_policies for profiles...");
  // Let's see if we can run an RPC or query a view. Since we can't run raw SQL, let's check if there are other ways.
  // Wait, we can query profiles table. What if we try to select profiles?
  // Let's see if we can find any profiles at all.
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone")
    .limit(5);
    
  console.log("Profiles Data:", data);
  console.log("Profiles Error:", error);
}

test();
