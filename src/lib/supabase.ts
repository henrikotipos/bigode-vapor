import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      establishments: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          phone: string
          address: string
          theme_color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          logo_url?: string | null
          phone: string
          address: string
          theme_color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          logo_url?: string | null
          phone?: string
          address?: string
          theme_color?: string
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          establishment_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          establishment_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          establishment_id?: string
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          cost: number | null
          stock: number
          image_url: string | null
          category_id: string
          establishment_id: string
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          cost?: number | null
          stock?: number
          image_url?: string | null
          category_id: string
          establishment_id: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          cost?: number | null
          stock?: number
          image_url?: string | null
          category_id?: string
          establishment_id?: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          customer_name: string
          customer_phone: string | null
          total: number
          status: string
          payment_method: string
          delivery_address: string | null
          establishment_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_name: string
          customer_phone?: string | null
          total: number
          status?: string
          payment_method: string
          delivery_address?: string | null
          establishment_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_name?: string
          customer_phone?: string | null
          total?: number
          status?: string
          payment_method?: string
          delivery_address?: string | null
          establishment_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          price: number
          notes: string | null
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          price: number
          notes?: string | null
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          price?: number
          notes?: string | null
        }
      }
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: string
          establishment_id: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          role?: string
          establishment_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: string
          establishment_id?: string | null
          created_at?: string
        }
      }
    }
  }
}