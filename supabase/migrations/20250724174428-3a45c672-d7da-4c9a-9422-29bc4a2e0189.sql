-- Fix admin role for the user
UPDATE profiles 
SET role = 'admin' 
WHERE email = '4rod07@gmail.com';