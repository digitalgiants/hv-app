// User roles
export type UserRole = "user" | "admin"
export type LicenseStatus = "inactive" | "active" | "suspended"
export type LicenseType = "lifetime" | "trial"

// Data import sources
export type DataSource = "brisnet_csv" | "equibase_csv" | "brisnet_api" | "equibase_api"
export type ImportStatus = "pending" | "processing" | "completed" | "failed"

// Racing
export type Surface = "D" | "T" | "AW"
export type HorseSex = "H" | "G" | "M" | "F" | "C" | "R"

export type SpeedFigureType =
  | "brisnet"
  | "beyer"
  | "timeform"
  | "pace_early"
  | "pace_late"
  | "pace_middle"
