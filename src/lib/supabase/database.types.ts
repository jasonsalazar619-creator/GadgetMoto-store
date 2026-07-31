export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type StaffRole =
  | "owner"
  | "administrator"
  | "sales"
  | "inventory"
  | "content";

export type ProductStatus = "draft" | "active" | "archived";
export type ProductCategory = "phone" | "tablet";

export type Database = {
  public: {
    Tables: {
      staff_profiles: {
        Row: {
          user_id: string;
          display_name: string;
          role: StaffRole;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          display_name: string;
          role: StaffRole;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string;
          role?: StaffRole;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          brand_id: string;
          name: string;
          slug: string;
          category: ProductCategory | null;
          short_description: string | null;
          full_description: string | null;
          highlights: Json;
          specifications: Json;
          status: ProductStatus;
          is_featured: boolean;
          is_public_preview: boolean;
          published_at: string | null;
          archived_at: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_active_administrator: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      staff_role: StaffRole;
      product_status: ProductStatus;
      product_category: ProductCategory;
    };
    CompositeTypes: Record<string, never>;
  };
};
