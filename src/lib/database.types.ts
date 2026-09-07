export type ProfileRole = "owner" | "customer";
export type AppointmentStatus = "confirmed" | "cancelled" | "completed";
export type BookedBy = "customer" | "owner";
export type NotificationAudience = "owner" | "customer";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: ProfileRole;
          full_name: string;
          phone: string | null;
          email: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          role?: ProfileRole;
          full_name?: string;
          phone?: string | null;
          email?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          name: string;
          category: string;
          price: number;
          duration_minutes: number;
          description: string | null;
          active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
          price: number;
          duration_minutes: number;
          description?: string | null;
          active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["services"]["Insert"]>;
        Relationships: [];
      };
      business_hours: {
        Row: {
          id: string;
          day_of_week: number;
          open_time: string | null;
          close_time: string | null;
          is_closed: boolean;
        };
        Insert: {
          id?: string;
          day_of_week: number;
          open_time?: string | null;
          close_time?: string | null;
          is_closed?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["business_hours"]["Insert"]>;
        Relationships: [];
      };
      availability_blocks: {
        Row: {
          id: string;
          start_at: string;
          end_at: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          start_at: string;
          end_at: string;
          reason?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["availability_blocks"]["Insert"]>;
        Relationships: [];
      };
      appointments: {
        Row: {
          id: string;
          customer_id: string | null;
          guest_name: string;
          guest_phone: string;
          guest_email: string | null;
          start_at: string;
          end_at: string;
          duration_minutes: number;
          total_price: number;
          status: AppointmentStatus;
          booked_by: BookedBy;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id?: string | null;
          guest_name: string;
          guest_phone: string;
          guest_email?: string | null;
          start_at: string;
          end_at?: string;
          duration_minutes?: number;
          total_price?: number;
          status?: AppointmentStatus;
          booked_by?: BookedBy;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["appointments"]["Insert"]>;
        Relationships: [];
      };
      appointment_services: {
        Row: {
          appointment_id: string;
          service_id: string;
        };
        Insert: {
          appointment_id: string;
          service_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["appointment_services"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "appointment_services_appointment_id_fkey";
            columns: ["appointment_id"];
            isOneToOne: false;
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointment_services_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          audience: NotificationAudience;
          customer_id: string | null;
          type: string;
          message: string;
          appointment_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          audience: NotificationAudience;
          customer_id?: string | null;
          type: string;
          message: string;
          appointment_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      busy_intervals: {
        Args: {
          p_from: string;
          p_to: string;
          p_exclude_appointment?: string | null;
        };
        Returns: { busy_start: string; busy_end: string }[];
      };
      create_booking: {
        Args: {
          p_service_ids: string[];
          p_start_at: string;
          p_guest_name: string;
          p_guest_phone: string;
          p_guest_email?: string | null;
          p_notes?: string | null;
          p_booked_by?: BookedBy;
        };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Service = Database["public"]["Tables"]["services"]["Row"];
export type BusinessHour = Database["public"]["Tables"]["business_hours"]["Row"];
export type AvailabilityBlock = Database["public"]["Tables"]["availability_blocks"]["Row"];
export type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
export type AppointmentNotification = Database["public"]["Tables"]["notifications"]["Row"];

/** Shape returned by `select("*, appointment_services(service:services(*))")`. */
export type AppointmentWithServices = Appointment & {
  appointment_services: { service: Service }[];
};

export function appointmentServices(appointment: AppointmentWithServices): Service[] {
  return (appointment.appointment_services ?? []).map((row) => row.service).filter(Boolean);
}

export function appointmentServiceNames(appointment: AppointmentWithServices): string {
  return appointmentServices(appointment)
    .map((service) => service.name)
    .join(", ");
}
