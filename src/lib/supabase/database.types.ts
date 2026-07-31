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
export type ProductCondition =
  | "brand_new"
  | "pre_loved"
  | "open_box"
  | "refurbished";
export type ProductBadge = "new" | "sale";

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
      brands: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string | null;
          is_active?: boolean;
          sort_order?: number;
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
        Insert: {
          id?: string;
          brand_id: string;
          name: string;
          slug: string;
          category?: ProductCategory | null;
          short_description?: string | null;
          full_description?: string | null;
          highlights?: Json;
          specifications?: Json;
          status?: ProductStatus;
          is_featured?: boolean;
          is_public_preview?: boolean;
          published_at?: string | null;
          archived_at?: string | null;
          sort_order: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          brand_id?: string;
          name?: string;
          slug?: string;
          category?: ProductCategory | null;
          short_description?: string | null;
          full_description?: string | null;
          highlights?: Json;
          specifications?: Json;
          status?: ProductStatus;
          is_featured?: boolean;
          is_public_preview?: boolean;
          published_at?: string | null;
          archived_at?: string | null;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          sku: string;
          variant_name: string;
          ram_gb: number | null;
          extended_ram_gb: number | null;
          storage_gb: number;
          condition: ProductCondition;
          current_price_centavos: number;
          srp_centavos: number | null;
          badge: ProductBadge | null;
          financing_available: boolean;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          sku: string;
          variant_name: string;
          ram_gb?: number | null;
          extended_ram_gb?: number | null;
          storage_gb: number;
          condition?: ProductCondition;
          current_price_centavos: number;
          srp_centavos?: number | null;
          badge?: ProductBadge | null;
          financing_available?: boolean;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          sku?: string;
          variant_name?: string;
          ram_gb?: number | null;
          extended_ram_gb?: number | null;
          storage_gb?: number;
          condition?: ProductCondition;
          current_price_centavos?: number;
          srp_centavos?: number | null;
          badge?: ProductBadge | null;
          financing_available?: boolean;
          is_active?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string | null;
          variant_id: string | null;
          storage_path: string;
          alt_text: string;
          media_type: "image" | "video";
          sort_order: number;
          is_primary: boolean;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          actor_user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          before_data: Json | null;
          after_data: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_user_id: string;
          action: string;
          entity_type: "brand" | "product" | "product_variant" | "product_image";
          entity_id?: string | null;
          before_data?: Json | null;
          after_data?: Json | null;
          created_at?: string;
        };
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
      can_permanently_delete_product: {
        Args: { target_product_id: string };
        Returns: boolean;
      };
      can_permanently_delete_variant: {
        Args: { target_variant_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      staff_role: StaffRole;
      product_status: ProductStatus;
      product_category: ProductCategory;
      product_condition: ProductCondition;
      product_badge: ProductBadge;
    };
    CompositeTypes: Record<string, never>;
  };
};
