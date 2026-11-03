/** The courier services the store can connect to. Safe to import anywhere: it holds no keys, only the
 *  shape of what each courier needs. The keys themselves are entered in Admin and kept scrambled. */

export type CourierField = { name: string; label: string; secret?: boolean; placeholder?: string; optional?: boolean };

export type CourierDef = {
  id: string;
  name: string;
  about: string;
  color: string; // brand colour for the chip
  fields: CourierField[];
  autoBook: boolean; // we can create the parcel straight from an order
  canTest: boolean; // we can check the keys against the courier
  hasSandbox?: boolean; // offers a test mode with no real parcels
  signupUrl: string;
  keysHelp: string; // where to find the keys in the courier's own panel
};

export const COURIERS: CourierDef[] = [
  {
    id: "steadfast",
    name: "Steadfast",
    about: "Nationwide cash-on-delivery courier. Parcels can be booked straight from an order here.",
    color: "#f7941d",
    autoBook: true,
    canTest: true,
    fields: [
      { name: "api_key", label: "API key", secret: true },
      { name: "secret_key", label: "Secret key", secret: true },
    ],
    signupUrl: "https://steadfast.com.bd/",
    keysHelp: "In your Steadfast merchant panel, open Settings, then API, to copy the API key and Secret key.",
  },
  {
    id: "pathao",
    name: "Pathao Courier",
    about: "Dhaka and nationwide delivery. Save the keys to connect; book parcels from the Pathao merchant panel and paste the tracking number here.",
    color: "#e02e24",
    autoBook: false,
    canTest: true,
    hasSandbox: true,
    fields: [
      { name: "client_id", label: "Client ID", secret: true },
      { name: "client_secret", label: "Client secret", secret: true },
      { name: "username", label: "Account email" },
      { name: "password", label: "Account password", secret: true },
      { name: "store_id", label: "Store ID", optional: true },
    ],
    signupUrl: "https://merchant.pathao.com/",
    keysHelp: "In the Pathao merchant panel, open Developer API to create credentials, then copy the Client ID, Client secret and the account email and password.",
  },
  {
    id: "redx",
    name: "RedX",
    about: "Nationwide delivery. Save the token to connect; book parcels in the RedX panel and paste the tracking number here.",
    color: "#d2232a",
    autoBook: false,
    canTest: false,
    fields: [{ name: "access_token", label: "API access token", secret: true }],
    signupUrl: "https://redx.com.bd/",
    keysHelp: "Ask RedX merchant support for your API access token, or copy it from the developer section of your RedX panel.",
  },
  {
    id: "ecourier",
    name: "eCourier",
    about: "Nationwide delivery. Save the keys to connect; book parcels in the eCourier panel and paste the tracking number here.",
    color: "#00a651",
    autoBook: false,
    canTest: false,
    fields: [
      { name: "user_id", label: "User ID" },
      { name: "api_key", label: "API key", secret: true },
      { name: "api_secret", label: "API secret", secret: true },
    ],
    signupUrl: "https://ecourier.com.bd/",
    keysHelp: "In your eCourier panel, open the API or developer section to copy the User ID, API key and API secret.",
  },
  {
    id: "paperfly",
    name: "Paperfly",
    about: "Nationwide delivery. Save the keys to connect; book parcels in the Paperfly panel and paste the tracking number here.",
    color: "#1b75bc",
    autoBook: false,
    canTest: false,
    fields: [
      { name: "username", label: "Username" },
      { name: "password", label: "Password", secret: true },
      { name: "api_key", label: "API key", secret: true },
    ],
    signupUrl: "https://paperfly.com.bd/",
    keysHelp: "Paperfly gives API credentials to merchants on request. Ask your Paperfly account manager for the username, password and API key.",
  },
];

export const courierDef = (id: string) => COURIERS.find((c) => c.id === id);
export const courierName = (id: string) => courierDef(id)?.name ?? id;
