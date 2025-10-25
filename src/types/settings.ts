export interface UserPreferences {
  id: string;
  user_id: string;
  bills_enabled: boolean;
  doordash_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface PersonalInfoFormData {
  first_name: string;
  last_name: string;
}

export interface PasswordUpdateFormData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}
