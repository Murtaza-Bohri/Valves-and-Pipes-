export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "packed"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type DbCategory = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  description: string | null;
  image: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type DbBrand = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  created_at: string;
  updated_at: string;
};

export type DbProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category_id: string;
  brand_id: string | null;
  main_image: string;
  datasheet_url?: string | null;
  has_impa: boolean;
  price: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  categories?: Pick<DbCategory, "name" | "slug"> | null;
  product_impa?: DbProductImpa[];
  product_images?: DbProductImage[];
};

/** @deprecated Legacy flat product row before migration */
export type DbLegacyProduct = {
  id: string;
  name: string;
  category: string;
  description: string;
  image: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type DbProductImage = {
  id: string;
  product_id: string;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
};

export type DbProductImpa = {
  id: string;
  product_id: string;
  impa_number: string;
  item_description: string;
  inventory_uom: string;
  price: number;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type DbProfile = {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type DbAddress = {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string | null;
  country: string;
  postal_code: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type CartStatus = "active" | "abandoned" | "converted";

export type DbCart = {
  id: string;
  user_id: string;
  status: CartStatus;
  created_at: string;
  updated_at: string;
};

export type DbCartItem = {
  id: string;
  cart_id: string;
  product_id: string;
  impa_id: string | null;
  quantity: number;
  price: number;
  created_at: string;
  updated_at: string;
};

export type DbOrder = {
  id: string;
  order_number: string;
  user_id: string | null;
  status: OrderStatus;
  subtotal: number;
  shipping_amount: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  shipping_address_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  shipping_address_line_1: string | null;
  shipping_address_line_2: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_country: string | null;
  shipping_postal_code: string | null;
  created_at: string;
  updated_at: string;
};

export type DbOrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  impa_id: string | null;
  product_name: string;
  impa_number: string | null;
  item_description: string | null;
  inventory_uom: string | null;
  price_at_purchase: number;
  quantity: number;
  image_url: string | null;
  created_at: string;
};

export type DbOrderStatusHistory = {
  id: string;
  order_id: string;
  status: OrderStatus;
  note: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      categories: { Row: DbCategory; Insert: Partial<DbCategory>; Update: Partial<DbCategory>; Relationships: [] };
      brands: { Row: DbBrand; Insert: Partial<DbBrand>; Update: Partial<DbBrand>; Relationships: [] };
      products: { Row: DbProduct; Insert: Partial<DbProduct>; Update: Partial<DbProduct>; Relationships: [] };
      product_images: { Row: DbProductImage; Insert: Partial<DbProductImage>; Update: Partial<DbProductImage>; Relationships: [] };
      product_impa: { Row: DbProductImpa; Insert: Partial<DbProductImpa>; Update: Partial<DbProductImpa>; Relationships: [] };
      profiles: { Row: DbProfile; Insert: Partial<DbProfile>; Update: Partial<DbProfile>; Relationships: [] };
      addresses: { Row: DbAddress; Insert: Partial<DbAddress>; Update: Partial<DbAddress>; Relationships: [] };
      carts: { Row: DbCart; Insert: Partial<DbCart>; Update: Partial<DbCart>; Relationships: [] };
      cart_items: { Row: DbCartItem; Insert: Partial<DbCartItem>; Update: Partial<DbCartItem>; Relationships: [] };
      orders: { Row: DbOrder; Insert: Partial<DbOrder>; Update: Partial<DbOrder>; Relationships: [] };
      order_items: { Row: DbOrderItem; Insert: Partial<DbOrderItem>; Update: Partial<DbOrderItem>; Relationships: [] };
      order_status_history: { Row: DbOrderStatusHistory; Insert: Partial<DbOrderStatusHistory>; Update: Partial<DbOrderStatusHistory>; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      generate_order_number: { Args: Record<string, never>; Returns: string };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
