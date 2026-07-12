import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "Fleet Manager" | "Driver" | "Safety Officer" | "Financial Analyst";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  driverId?: string; // link to Driver record when role=Driver
}

export type VehicleStatus = "Available" | "On Trip" | "In Shop" | "Retired";
export interface Vehicle {
  id: string;
  regNumber: string;
  name: string;
  type: "Van" | "Truck" | "Car" | "Bus";
  capacity: number; // kg
  odometer: number; // km
  acquisitionCost: number;
  status: VehicleStatus;
  region: string;
  documentUrl?: string;
}

export type DriverStatus = "Available" | "On Trip" | "Off Duty" | "Suspended";
export interface Driver {
  id: string;
  licenseNumber: string;
  name: string;
  licenseCategory: string;
  licenseExpiry: string; // ISO date
  contact: string;
  safetyScore: number;
  status: DriverStatus;
  documentUrl?: string;
}

export type TripStatus = "Draft" | "Dispatched" | "Completed" | "Cancelled";
export interface Trip {
  id: string;
  source: string;
  destination: string;
  cargoWeight: number;
  plannedDistance: number;
  status: TripStatus;
  vehicleId: string;
  driverId: string;
  revenue: number;
  finalOdometer?: number;
  fuelConsumed?: number;
  createdAt: string;
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  startDate: string;
  endDate?: string;
  description: string;
  cost: number;
  status: "Open" | "Closed";
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  liters: number;
  cost: number;
  date: string;
}

export interface Expense {
  id: string;
  vehicleId: string;
  type: "Toll" | "Fine" | "Miscellaneous";
  cost: number;
  date: string;
}

const uid = () => Math.random().toString(36).slice(2, 10);

interface State {
  currentRole: Role;
  users: User[];
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  maintenance: MaintenanceLog[];
  fuel: FuelLog[];
  expenses: Expense[];

  setRole: (r: Role) => void;

  addVehicle: (v: Omit<Vehicle, "id">) => { ok: boolean; error?: string };
  updateVehicle: (id: string, patch: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;

  addDriver: (d: Omit<Driver, "id">) => { ok: boolean; error?: string };
  updateDriver: (id: string, patch: Partial<Driver>) => void;
  deleteDriver: (id: string) => void;

  addTrip: (t: Omit<Trip, "id" | "createdAt" | "status">) => { ok: boolean; error?: string };
  dispatchTrip: (id: string) => { ok: boolean; error?: string };
  completeTrip: (id: string, finalOdometer: number, fuelConsumed: number) => { ok: boolean; error?: string };
  cancelTrip: (id: string) => void;
  deleteTrip: (id: string) => void;

  openMaintenance: (m: Omit<MaintenanceLog, "id" | "status">) => void;
  closeMaintenance: (id: string, endDate: string) => void;
  deleteMaintenance: (id: string) => void;

  addFuel: (f: Omit<FuelLog, "id">) => void;
  addExpense: (e: Omit<Expense, "id">) => void;

  resetSeed: () => void;
}

const todayPlus = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const seedVehicles: Vehicle[] = [
  { id: "v1", regNumber: "TN-01-AB-1234", name: "Tata Ace", type: "Van", capacity: 750, odometer: 42000, acquisitionCost: 550000, status: "Available", region: "South" },
  { id: "v2", regNumber: "MH-12-CD-5678", name: "Ashok Leyland Dost", type: "Truck", capacity: 3000, odometer: 87000, acquisitionCost: 1200000, status: "On Trip", region: "West" },
  { id: "v3", regNumber: "DL-08-EF-9012", name: "Mahindra Bolero Pickup", type: "Van", capacity: 1500, odometer: 15000, acquisitionCost: 750000, status: "In Shop", region: "North" },
  { id: "v4", regNumber: "KA-05-GH-3456", name: "Eicher Pro 3015", type: "Truck", capacity: 8000, odometer: 120000, acquisitionCost: 2500000, status: "Available", region: "South" },
  { id: "v5", regNumber: "GJ-01-IJ-7890", name: "Force Traveller", type: "Bus", capacity: 2000, odometer: 55000, acquisitionCost: 1800000, status: "Retired", region: "West" },
];

const seedDrivers: Driver[] = [
  { id: "d1", licenseNumber: "DL-2024-001", name: "Rajesh Kumar", licenseCategory: "HMV", licenseExpiry: todayPlus(365), contact: "+91 98765 43210", safetyScore: 92, status: "On Trip" },
  { id: "d2", licenseNumber: "DL-2023-045", name: "Priya Sharma", licenseCategory: "LMV", licenseExpiry: todayPlus(180), contact: "+91 98765 12345", safetyScore: 88, status: "Available" },
  { id: "d3", licenseNumber: "DL-2022-089", name: "Arjun Singh", licenseCategory: "HMV", licenseExpiry: todayPlus(-15), contact: "+91 91234 56789", safetyScore: 65, status: "Available" },
  { id: "d4", licenseNumber: "DL-2024-112", name: "Meera Patel", licenseCategory: "LMV", licenseExpiry: todayPlus(720), contact: "+91 99887 76655", safetyScore: 95, status: "Off Duty" },
  { id: "d5", licenseNumber: "DL-2021-234", name: "Vikram Reddy", licenseCategory: "HMV", licenseExpiry: todayPlus(90), contact: "+91 90000 11111", safetyScore: 45, status: "Suspended" },
];

const seedUsers: User[] = [
  { id: "u1", name: "Anita Rao", email: "manager@transitops.io", password: "demo", role: "Fleet Manager" },
  { id: "u2", name: "Rajesh Kumar", email: "driver@transitops.io", password: "demo", role: "Driver", driverId: "d1" },
  { id: "u3", name: "Deepak Mehta", email: "safety@transitops.io", password: "demo", role: "Safety Officer" },
  { id: "u4", name: "Sanya Iyer", email: "finance@transitops.io", password: "demo", role: "Financial Analyst" },
];

const seedTrips: Trip[] = [
  { id: "t1", source: "Chennai", destination: "Bengaluru", cargoWeight: 2500, plannedDistance: 350, status: "Dispatched", vehicleId: "v2", driverId: "d1", revenue: 45000, createdAt: new Date().toISOString() },
  { id: "t2", source: "Mumbai", destination: "Pune", cargoWeight: 500, plannedDistance: 150, status: "Completed", vehicleId: "v1", driverId: "d2", revenue: 18000, finalOdometer: 42150, fuelConsumed: 22, createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: "t3", source: "Delhi", destination: "Jaipur", cargoWeight: 1200, plannedDistance: 280, status: "Draft", vehicleId: "v4", driverId: "d2", revenue: 32000, createdAt: new Date().toISOString() },
];

const seedMaintenance: MaintenanceLog[] = [
  { id: "m1", vehicleId: "v3", startDate: todayPlus(-5), description: "Engine overhaul & brake replacement", cost: 45000, status: "Open" },
  { id: "m2", vehicleId: "v1", startDate: todayPlus(-30), endDate: todayPlus(-25), description: "Routine service", cost: 8500, status: "Closed" },
  { id: "m3", vehicleId: "v4", startDate: todayPlus(-60), endDate: todayPlus(-58), description: "Tire replacement", cost: 22000, status: "Closed" },
];

const seedFuel: FuelLog[] = [
  { id: "f1", vehicleId: "v1", liters: 22, cost: 2200, date: todayPlus(-3) },
  { id: "f2", vehicleId: "v2", liters: 85, cost: 8500, date: todayPlus(-1) },
  { id: "f3", vehicleId: "v4", liters: 120, cost: 12000, date: todayPlus(-10) },
  { id: "f4", vehicleId: "v1", liters: 18, cost: 1800, date: todayPlus(-15) },
];

const seedExpenses: Expense[] = [
  { id: "e1", vehicleId: "v2", type: "Toll", cost: 1200, date: todayPlus(-1) },
  { id: "e2", vehicleId: "v1", type: "Toll", cost: 450, date: todayPlus(-3) },
  { id: "e3", vehicleId: "v4", type: "Fine", cost: 2500, date: todayPlus(-20) },
  { id: "e4", vehicleId: "v2", type: "Miscellaneous", cost: 800, date: todayPlus(-5) },
];

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      currentRole: "Fleet Manager",
      users: seedUsers,
      vehicles: seedVehicles,
      drivers: seedDrivers,
      trips: seedTrips,
      maintenance: seedMaintenance,
      fuel: seedFuel,
      expenses: seedExpenses,

      setRole: (r) => set({ currentRole: r }),

      addVehicle: (v) => {
        if (get().vehicles.some((x) => x.regNumber.toLowerCase() === v.regNumber.toLowerCase()))
          return { ok: false, error: "Registration number must be unique" };
        set((s) => ({ vehicles: [...s.vehicles, { ...v, id: uid() }] }));
        return { ok: true };
      },
      updateVehicle: (id, patch) =>
        set((s) => ({ vehicles: s.vehicles.map((v) => (v.id === id ? { ...v, ...patch } : v)) })),
      deleteVehicle: (id) => set((s) => ({ vehicles: s.vehicles.filter((v) => v.id !== id) })),

      addDriver: (d) => {
        if (get().drivers.some((x) => x.licenseNumber.toLowerCase() === d.licenseNumber.toLowerCase()))
          return { ok: false, error: "License number must be unique" };
        set((s) => ({ drivers: [...s.drivers, { ...d, id: uid() }] }));
        return { ok: true };
      },
      updateDriver: (id, patch) =>
        set((s) => ({ drivers: s.drivers.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),
      deleteDriver: (id) => set((s) => ({ drivers: s.drivers.filter((d) => d.id !== id) })),

      addTrip: (t) => {
        const v = get().vehicles.find((x) => x.id === t.vehicleId);
        const d = get().drivers.find((x) => x.id === t.driverId);
        if (!v || !d) return { ok: false, error: "Vehicle and driver required" };
        if (v.status === "Retired" || v.status === "In Shop")
          return { ok: false, error: "Vehicle unavailable (Retired/In Shop)" };
        if (v.status === "On Trip") return { ok: false, error: "Vehicle already on a trip" };
        if (d.status === "Suspended") return { ok: false, error: "Driver is Suspended" };
        if (new Date(d.licenseExpiry) < new Date())
          return { ok: false, error: "Driver license expired" };
        if (d.status === "On Trip") return { ok: false, error: "Driver already on a trip" };
        if (t.cargoWeight > v.capacity)
          return { ok: false, error: `Cargo exceeds vehicle capacity (${v.capacity} kg)` };
        set((s) => ({
          trips: [
            ...s.trips,
            { ...t, id: uid(), status: "Draft", createdAt: new Date().toISOString() },
          ],
        }));
        return { ok: true };
      },
      dispatchTrip: (id) => {
        const trip = get().trips.find((t) => t.id === id);
        if (!trip) return { ok: false, error: "Trip not found" };
        if (trip.status !== "Draft") return { ok: false, error: "Only Draft trips can be dispatched" };
        const v = get().vehicles.find((x) => x.id === trip.vehicleId);
        const d = get().drivers.find((x) => x.id === trip.driverId);
        if (!v || !d) return { ok: false, error: "Missing vehicle/driver" };
        if (v.status !== "Available") return { ok: false, error: "Vehicle not available" };
        if (d.status !== "Available") return { ok: false, error: "Driver not available" };
        if (new Date(d.licenseExpiry) < new Date())
          return { ok: false, error: "Driver license expired" };
        set((s) => ({
          trips: s.trips.map((t) => (t.id === id ? { ...t, status: "Dispatched" } : t)),
          vehicles: s.vehicles.map((x) => (x.id === v.id ? { ...x, status: "On Trip" } : x)),
          drivers: s.drivers.map((x) => (x.id === d.id ? { ...x, status: "On Trip" } : x)),
        }));
        return { ok: true };
      },
      completeTrip: (id, finalOdometer, fuelConsumed) => {
        const trip = get().trips.find((t) => t.id === id);
        if (!trip) return { ok: false, error: "Trip not found" };
        if (trip.status !== "Dispatched") return { ok: false, error: "Trip not dispatched" };
        set((s) => ({
          trips: s.trips.map((t) =>
            t.id === id ? { ...t, status: "Completed", finalOdometer, fuelConsumed } : t,
          ),
          vehicles: s.vehicles.map((x) =>
            x.id === trip.vehicleId ? { ...x, status: "Available", odometer: finalOdometer } : x,
          ),
          drivers: s.drivers.map((x) =>
            x.id === trip.driverId ? { ...x, status: "Available" } : x,
          ),
          fuel: [
            ...s.fuel,
            {
              id: uid(),
              vehicleId: trip.vehicleId,
              liters: fuelConsumed,
              cost: fuelConsumed * 100,
              date: new Date().toISOString().slice(0, 10),
            },
          ],
        }));
        return { ok: true };
      },
      cancelTrip: (id) => {
        const trip = get().trips.find((t) => t.id === id);
        if (!trip) return;
        set((s) => ({
          trips: s.trips.map((t) => (t.id === id ? { ...t, status: "Cancelled" } : t)),
          vehicles:
            trip.status === "Dispatched"
              ? s.vehicles.map((x) =>
                  x.id === trip.vehicleId ? { ...x, status: "Available" } : x,
                )
              : s.vehicles,
          drivers:
            trip.status === "Dispatched"
              ? s.drivers.map((x) => (x.id === trip.driverId ? { ...x, status: "Available" } : x))
              : s.drivers,
        }));
      },

      deleteTrip: (id) => {
        const trip = get().trips.find((t) => t.id === id);
        if (!trip) return;
        set((s) => ({
          trips: s.trips.filter((t) => t.id !== id),
          vehicles:
            trip.status === "Dispatched"
              ? s.vehicles.map((x) =>
                  x.id === trip.vehicleId ? { ...x, status: "Available" } : x,
                )
              : s.vehicles,
          drivers:
            trip.status === "Dispatched"
              ? s.drivers.map((x) => (x.id === trip.driverId ? { ...x, status: "Available" } : x))
              : s.drivers,
        }));
      },

      openMaintenance: (m) =>
        set((s) => ({
          maintenance: [...s.maintenance, { ...m, id: uid(), status: "Open" }],
          vehicles: s.vehicles.map((v) =>
            v.id === m.vehicleId && v.status !== "Retired" ? { ...v, status: "In Shop" } : v,
          ),
        })),
      closeMaintenance: (id, endDate) => {
        const log = get().maintenance.find((m) => m.id === id);
        if (!log) return;
        set((s) => ({
          maintenance: s.maintenance.map((m) =>
            m.id === id ? { ...m, status: "Closed", endDate } : m,
          ),
          vehicles: s.vehicles.map((v) =>
            v.id === log.vehicleId && v.status === "In Shop" ? { ...v, status: "Available" } : v,
          ),
        }));
      },
      addFuel: (f) => set((s) => ({ fuel: [...s.fuel, { ...f, id: uid() }] })),
      addExpense: (e) => set((s) => ({ expenses: [...s.expenses, { ...e, id: uid() }] })),
      resetSeed: () =>
        set({
          currentRole: "Fleet Manager",
          users: seedUsers,
          vehicles: seedVehicles,
          drivers: seedDrivers,
          trips: seedTrips,
          maintenance: seedMaintenance,
          fuel: seedFuel,
          expenses: seedExpenses,
        }),
    }),
    { name: "transitops-store" },
  ),
);

export const isLicenseExpired = (d: Driver) => new Date(d.licenseExpiry) < new Date();
