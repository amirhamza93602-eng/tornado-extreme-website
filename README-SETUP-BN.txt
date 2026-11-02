TORNADO EXTREME — PLAYER PORTAL UPDATE
=====================================

এই ZIP-এ আপডেটেড Player Portal, Admin Dashboard, Intra-Club Win Submission,
Squad Management, Player Verification এবং COBEG profile-linking ফিচার রয়েছে।

গুরুত্বপূর্ণ:
- Overall Stats / Google Sheet অংশে কোনো পরিবর্তন করা হয়নি।
- Intra-Club Tournament Stats আলাদা থাকবে। এখানে শুধু Admin-approved wins গণনা হবে;
  এই win-only submission থেকে losses বা win rate হিসাব করা হবে না।
- COBEG শুধু profile link হিসেবে যুক্ত। Official API/data access ছাড়া live stats sync দাবি করা হচ্ছে না।
- Supabase service_role/secret key কখনো website files-এ বা কারও সঙ্গে share করবেন না।

SUPABASE UPDATE (একবারই করতে হবে)
---------------------------------
1. Supabase Dashboard → SQL Editor খুলুন।
2. এই ZIP-এর SUPABASE-ALL-IN-ONE-UPDATE.sql ফাইলের সম্পূর্ণ SQL paste করে Run করুন।
3. SQL সফল হলে আলাদা করে SUPABASE-CLUB-FEATURES.sql, SUPABASE-REPAIR-PATCH.sql
   বা SUPABASE-COBEG-LINK.sql আবার চালানোর প্রয়োজন নেই।
4. এই SQL existing is_admin(), review_player(), set_admin_role() helper functions
   ধরে নেয়—আগের portal setup-এর functions মুছে ফেলবেন না।

NETLIFY DEPLOY
--------------
1. ZIP extract করুন।
2. tor5 ফোল্ডারের ভেতরের সব website file/folder Netlify-তে deploy করুন
   (ZIP ফাইলটি সরাসরি site হিসেবে upload করবেন না)।
3. Deploy complete হলে browser-এ Ctrl + Shift + R দিয়ে hard refresh করুন।
4. Logout করে আবার login করুন।

CHECKLIST
---------
- Player registration এবং Admin approval
- Login / Logout
- My Profile save: Facebook, Device, COBEG link, Avatar URL, Bio
- Player Dashboard: approved/pending Intra-Club submissions
- Admin Dashboard: applications, win approval/rejection, squad changes,
  verification controls এবং announcements
- Public player cards / squad rosters এবং COBEG profile link

যদি Supabase SQL Editor error দেয়, error-এর সম্পূর্ণ text বা screenshot পাঠান।
একই SQL বারবার চালানোর আগে error দেখে নেবেন।
