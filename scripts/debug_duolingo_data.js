const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mzjxnchlcmjpqfskppsg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16anhuY2hsY21qcHFmc2twcHNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0OTcwNTMsImV4cCI6MjA4MjA3MzA1M30.bRMVr0YZcRTDEjh-W7jUGOBJS-RgVM0V9cwSP0PO0cY';
const userId = 'f484bfe8-2771-4e0f-b765-830fbdb3c74e';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log(`Checking data for user: ${userId}`);

  // 1. Check duolingo_activity
  const { count: duoCount } = await supabase
    .from('duolingo_activity')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  console.log(`duolingo_activity records: ${duoCount}`);

  // 2. Check french_learning
  const { count: frenchCount } = await supabase
    .from('french_learning')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  console.log(`french_learning records: ${frenchCount}`);

  // 3. Check german_learning
  const { count: germanCount } = await supabase
    .from('german_learning')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  console.log(`german_learning records: ${germanCount}`);

  if (frenchCount > 0) {
      const { data } = await supabase.from('french_learning').select('*').eq('user_id', userId).limit(1);
      console.log('Sample french record:', data[0]);
  }
}

checkData();
