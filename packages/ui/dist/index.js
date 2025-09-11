"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  Accordion: () => Accordion,
  AccordionContent: () => AccordionContent,
  AccordionItem: () => AccordionItem,
  AccordionTrigger: () => AccordionTrigger,
  Alert: () => Alert,
  AlertDescription: () => AlertDescription,
  AlertDialog: () => AlertDialog,
  AlertDialogAction: () => AlertDialogAction,
  AlertDialogCancel: () => AlertDialogCancel,
  AlertDialogContent: () => AlertDialogContent,
  AlertDialogDescription: () => AlertDialogDescription,
  AlertDialogFooter: () => AlertDialogFooter,
  AlertDialogHeader: () => AlertDialogHeader,
  AlertDialogOverlay: () => AlertDialogOverlay,
  AlertDialogPortal: () => AlertDialogPortal,
  AlertDialogTitle: () => AlertDialogTitle,
  AlertDialogTrigger: () => AlertDialogTrigger,
  AlertTitle: () => AlertTitle,
  AuctionCard: () => AuctionCard,
  AuctionListItem: () => AuctionListItem,
  Avatar: () => Avatar,
  AvatarFallback: () => AvatarFallback,
  AvatarImage: () => AvatarImage,
  Badge: () => Badge,
  Button: () => Button,
  Calendar: () => Calendar,
  Card: () => Card,
  CardContent: () => CardContent,
  CardDescription: () => CardDescription,
  CardFooter: () => CardFooter,
  CardHeader: () => CardHeader,
  CardTitle: () => CardTitle,
  Checkbox: () => Checkbox,
  Command: () => Command,
  CommandDialog: () => CommandDialog,
  CommandEmpty: () => CommandEmpty,
  CommandGroup: () => CommandGroup,
  CommandInput: () => CommandInput,
  CommandItem: () => CommandItem,
  CommandList: () => CommandList,
  CommandSeparator: () => CommandSeparator,
  CommandShortcut: () => CommandShortcut,
  DataTable: () => DataTable,
  DataTableColumnHeader: () => DataTableColumnHeader,
  DataTableFacetedFilter: () => DataTableFacetedFilter,
  DataTablePagination: () => DataTablePagination,
  DataTableToolbar: () => DataTableToolbar,
  DataTableViewOptions: () => DataTableViewOptions,
  DirectSaleOfferCard: () => DirectSaleOfferCard,
  DirectSaleOfferListItem: () => DirectSaleOfferListItem,
  DropdownMenu: () => DropdownMenu,
  DropdownMenuCheckboxItem: () => DropdownMenuCheckboxItem,
  DropdownMenuContent: () => DropdownMenuContent,
  DropdownMenuGroup: () => DropdownMenuGroup,
  DropdownMenuItem: () => DropdownMenuItem,
  DropdownMenuLabel: () => DropdownMenuLabel,
  DropdownMenuPortal: () => DropdownMenuPortal,
  DropdownMenuRadioGroup: () => DropdownMenuRadioGroup,
  DropdownMenuRadioItem: () => DropdownMenuRadioItem,
  DropdownMenuSeparator: () => DropdownMenuSeparator,
  DropdownMenuShortcut: () => DropdownMenuShortcut,
  DropdownMenuSub: () => DropdownMenuSub,
  DropdownMenuSubContent: () => DropdownMenuSubContent,
  DropdownMenuSubTrigger: () => DropdownMenuSubTrigger,
  DropdownMenuTrigger: () => DropdownMenuTrigger,
  Form: () => Form,
  FormControl: () => FormControl,
  FormDescription: () => FormDescription,
  FormField: () => FormField,
  FormItem: () => FormItem,
  FormLabel: () => FormLabel,
  FormMessage: () => FormMessage,
  Input: () => Input,
  Label: () => Label2,
  LotCard: () => LotCard,
  LotListItem: () => LotListItem,
  Menubar: () => Menubar,
  MenubarCheckboxItem: () => MenubarCheckboxItem,
  MenubarContent: () => MenubarContent,
  MenubarGroup: () => MenubarGroup,
  MenubarItem: () => MenubarItem,
  MenubarLabel: () => MenubarLabel,
  MenubarMenu: () => MenubarMenu,
  MenubarPortal: () => MenubarPortal,
  MenubarRadioGroup: () => MenubarRadioGroup,
  MenubarRadioItem: () => MenubarRadioItem,
  MenubarSeparator: () => MenubarSeparator,
  MenubarShortcut: () => MenubarShortcut,
  MenubarSub: () => MenubarSub,
  MenubarSubContent: () => MenubarSubContent,
  MenubarSubTrigger: () => MenubarSubTrigger,
  MenubarTrigger: () => MenubarTrigger,
  NavigationMenu: () => NavigationMenu,
  NavigationMenuContent: () => NavigationMenuContent,
  NavigationMenuIndicator: () => NavigationMenuIndicator,
  NavigationMenuItem: () => NavigationMenuItem,
  NavigationMenuLink: () => NavigationMenuLink,
  NavigationMenuList: () => NavigationMenuList,
  NavigationMenuTrigger: () => NavigationMenuTrigger,
  NavigationMenuViewport: () => NavigationMenuViewport,
  Popover: () => Popover,
  PopoverContent: () => PopoverContent,
  PopoverTrigger: () => PopoverTrigger,
  Progress: () => Progress,
  RadioGroup: () => RadioGroup3,
  RadioGroupItem: () => RadioGroupItem,
  ScrollArea: () => ScrollArea,
  ScrollBar: () => ScrollBar,
  Select: () => Select,
  SelectContent: () => SelectContent,
  SelectGroup: () => SelectGroup,
  SelectItem: () => SelectItem,
  SelectLabel: () => SelectLabel,
  SelectScrollDownButton: () => SelectScrollDownButton,
  SelectScrollUpButton: () => SelectScrollUpButton,
  SelectSeparator: () => SelectSeparator,
  SelectTrigger: () => SelectTrigger,
  SelectValue: () => SelectValue,
  Separator: () => Separator4,
  Sheet: () => Sheet,
  SheetClose: () => SheetClose,
  SheetContent: () => SheetContent,
  SheetDescription: () => SheetDescription,
  SheetFooter: () => SheetFooter,
  SheetHeader: () => SheetHeader,
  SheetOverlay: () => SheetOverlay,
  SheetPortal: () => SheetPortal,
  SheetTitle: () => SheetTitle,
  SheetTrigger: () => SheetTrigger,
  Skeleton: () => Skeleton,
  Slider: () => Slider,
  Switch: () => Switch,
  Table: () => Table,
  TableBody: () => TableBody,
  TableCaption: () => TableCaption,
  TableCell: () => TableCell,
  TableFooter: () => TableFooter,
  TableHead: () => TableHead,
  TableHeader: () => TableHeader,
  TableRow: () => TableRow,
  Tabs: () => Tabs,
  TabsContent: () => TabsContent,
  TabsList: () => TabsList,
  TabsTrigger: () => TabsTrigger,
  Textarea: () => Textarea,
  Toast: () => Toast,
  ToastAction: () => ToastAction,
  ToastClose: () => ToastClose,
  ToastDescription: () => ToastDescription,
  ToastProvider: () => ToastProvider,
  ToastTitle: () => ToastTitle,
  ToastViewport: () => ToastViewport,
  Toaster: () => Toaster,
  Tooltip: () => Tooltip,
  TooltipContent: () => TooltipContent,
  TooltipProvider: () => TooltipProvider,
  TooltipTrigger: () => TooltipTrigger,
  addFavoriteLotIdToStorage: () => addFavoriteLotIdToStorage,
  addRecentlyViewedId: () => addRecentlyViewedId,
  badgeVariants: () => badgeVariants,
  buttonVariants: () => buttonVariants,
  cn: () => cn,
  createEntitySelectorColumns: () => createEntitySelectorColumns,
  getActiveStage: () => getActiveStage,
  getAuctionStatusColor: () => getAuctionStatusColor,
  getAuctionStatusText: () => getAuctionStatusText,
  getCategoryAssets: () => getCategoryAssets,
  getEffectiveLotEndDate: () => getEffectiveLotEndDate,
  getFavoriteLotIdsFromStorage: () => getFavoriteLotIdsFromStorage,
  getLotPriceForStage: () => getLotPriceForStage,
  getLotStatusColor: () => getLotStatusColor,
  getPaymentStatusText: () => getPaymentStatusText,
  getRecentlyViewedIds: () => getRecentlyViewedIds,
  getUniqueLotLocations: () => getUniqueLotLocations,
  getUserDocumentStatusColor: () => getUserDocumentStatusColor,
  getUserDocumentStatusInfo: () => getUserDocumentStatusInfo,
  getUserHabilitationStatusInfo: () => getUserHabilitationStatusInfo,
  isLotFavoriteInStorage: () => isLotFavoriteInStorage,
  isValidImageUrl: () => isValidImageUrl,
  navigationMenuTriggerStyle: () => navigationMenuTriggerStyle,
  removeFavoriteLotIdFromStorage: () => removeFavoriteLotIdFromStorage,
  removeRecentlyViewedId: () => removeRecentlyViewedId,
  slugify: () => import_core.slugify,
  useFormField: () => useFormField
});
module.exports = __toCommonJS(index_exports);

// src/lib/utils.ts
var import_clsx = require("clsx");
var import_tailwind_merge = require("tailwind-merge");
function cn(...inputs) {
  return (0, import_tailwind_merge.twMerge)((0, import_clsx.clsx)(inputs));
}

// src/lib/ui-helpers.ts
var import_lucide_react = require("lucide-react");
var import_date_fns = require("date-fns");
var import_core = require("@bidexpert/core");
var isValidImageUrl = (url) => {
  if (!url) {
    return false;
  }
  if (url.startsWith("/")) {
    return true;
  }
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (e) {
    return false;
  }
};
var getAuctionStatusText = (status) => {
  if (!status) return "Status Desconhecido";
  switch (status) {
    case "ABERTO_PARA_LANCES":
      return "Aberto para Lances";
    case "EM_BREVE":
      return "Em Breve";
    case "ENCERRADO":
      return "Encerrado";
    case "FINALIZADO":
      return "Finalizado";
    case "ABERTO":
      return "Aberto";
    case "CANCELADO":
      return "Cancelado";
    case "SUSPENSO":
      return "Suspenso";
    case "VENDIDO":
      return "Vendido";
    case "NAO_VENDIDO":
      return "N\xE3o Vendido";
    case "NOT_SENT":
      return "N\xE3o Enviado";
    case "SUBMITTED":
      return "Enviado";
    case "APPROVED":
      return "Aprovado";
    case "REJECTED":
      return "Rejeitado";
    case "PENDING_ANALYSIS":
      return "Em An\xE1lise";
    case "PENDING_DOCUMENTS":
      return "Documentos Pendentes";
    case "HABILITADO":
      return "Habilitado";
    case "REJECTED_DOCUMENTS":
      return "Documentos Rejeitados";
    case "BLOCKED":
      return "Conta Bloqueada";
    case "ACTIVE":
      return "Ativa";
    case "SOLD":
      return "Vendido";
    case "EXPIRED":
      return "Expirada";
    case "PENDING_APPROVAL":
      return "Pendente Aprova\xE7\xE3o";
    case "RASCUNHO":
      return "Rascunho";
    case "EM_PREPARACAO":
      return "Em Prepara\xE7\xE3o";
    case "PENDENTE":
      return "Pendente";
    case "PROCESSANDO":
      return "Processando";
    case "PAGO":
      return "Pago";
    case "FALHOU":
      return "Falhou";
    case "REEMBOLSADO":
      return "Reembolsado";
    default: {
      if (typeof status === "string") {
        return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
      }
      return "Status Desconhecido";
    }
  }
};
var getLotStatusColor = (status) => {
  switch (status) {
    case "ABERTO_PARA_LANCES":
    case "ACTIVE":
      return "bg-green-600 text-white";
    case "EM_BREVE":
    case "PENDING_APPROVAL":
      return "bg-blue-500 text-white";
    case "ENCERRADO":
    case "VENDIDO":
    case "NAO_VENDIDO":
    case "SOLD":
    case "EXPIRED":
      return "bg-gray-500 text-white";
    default:
      return "bg-gray-300 text-gray-800";
  }
};
var getAuctionStatusColor = (status) => {
  if (!status) return "bg-gray-400 text-gray-800";
  switch (status) {
    case "ABERTO_PARA_LANCES":
    case "ABERTO":
      return "bg-green-600 text-white";
    case "EM_BREVE":
      return "bg-blue-500 text-white";
    case "ENCERRADO":
    case "FINALIZADO":
    case "CANCELADO":
    case "SUSPENSO":
      return "bg-gray-500 text-white";
    case "RASCUNHO":
    case "EM_PREPARACAO":
      return "bg-yellow-500 text-white";
    default:
      return "bg-gray-300 text-gray-800";
  }
};
var getPaymentStatusText = (status) => getAuctionStatusText(status);
var getUserDocumentStatusColor = (status) => {
  switch (status) {
    case "APPROVED":
      return "green-500";
    case "REJECTED":
      return "red-500";
    case "PENDING_ANALYSIS":
    case "SUBMITTED":
      return "yellow-500";
    case "NOT_SENT":
    default:
      return "gray-400";
  }
};
var getUserDocumentStatusInfo = (status) => {
  switch (status) {
    case "APPROVED":
      return { text: "Aprovado", icon: import_lucide_react.CheckCircle, badgeVariant: "secondary", textColor: "text-green-700" };
    case "REJECTED":
      return { text: "Rejeitado", icon: import_lucide_react.FileWarning, badgeVariant: "destructive", textColor: "text-destructive" };
    case "PENDING_ANALYSIS":
      return { text: "Em An\xE1lise", icon: import_lucide_react.Clock, badgeVariant: "outline", textColor: "text-yellow-600" };
    case "SUBMITTED":
      return { text: "Enviado", icon: import_lucide_react.Clock, badgeVariant: "outline", textColor: "text-yellow-600" };
    case "NOT_SENT":
    default:
      return { text: "N\xE3o Enviado", icon: import_lucide_react.FileUp, badgeVariant: "secondary", textColor: "text-muted-foreground" };
  }
};
var getUserHabilitationStatusInfo = (status) => {
  switch (status) {
    case "HABILITADO":
      return { text: "Habilitado", description: "Voc\xEA est\xE1 habilitado para dar lances!", textColor: "text-green-600", icon: import_lucide_react.CheckCircle2, progress: 100 };
    case "PENDING_ANALYSIS":
      return { text: "Em An\xE1lise", description: "Nossa equipe est\xE1 analisando seus documentos.", textColor: "text-yellow-600", icon: import_lucide_react.Clock, progress: 75 };
    case "PENDING_DOCUMENTS":
      return { text: "Documentos Pendentes", description: "Envie os documentos marcados como obrigat\xF3rios (*) para prosseguir.", textColor: "text-orange-600", icon: import_lucide_react.FileWarning, progress: 25 };
    case "REJECTED_DOCUMENTS":
      return { text: "Documentos Rejeitados", description: "Um ou mais documentos foram rejeitados. Verifique abaixo.", textColor: "text-red-600", icon: import_lucide_react.FileWarning, progress: 50 };
    case "BLOCKED":
      return { text: "Conta Bloqueada", description: "Sua conta est\xE1 bloqueada. Entre em contato com o suporte.", textColor: "text-gray-700", icon: import_lucide_react.ShieldAlert, progress: 0 };
    default:
      return { text: "Pendente", description: "Complete seu cadastro e envie os documentos.", textColor: "text-muted-foreground", icon: import_lucide_react.HelpCircle, progress: 10 };
  }
};
var getCategoryAssets = (categoryName) => {
  const assets = {
    "Leil\xF5es Judiciais": { bannerUrl: "https://placehold.co/1200x250.png?text=Leiloes+Judiciais", bannerAiHint: "tribunal martelo" },
    "Leil\xF5es Extrajudiciais": { bannerUrl: "https://placehold.co/1200x250.png?text=Leiloes+Extrajudiciais", bannerAiHint: "contrato assinatura" },
    "Tomada de Pre\xE7os": { bannerUrl: "https://placehold.co/1200x250.png?text=Tomada+de+Precos", bannerAiHint: "documentos negocios" },
    "Venda Direta": { bannerUrl: "https://placehold.co/1200x250.png?text=Venda+Direta", bannerAiHint: "carrinho compras" },
    "Segunda Pra\xE7a": { bannerUrl: "https://placehold.co/1200x250.png?text=Segunda+Praca", bannerAiHint: "desconto oportunidade" },
    "Leil\xF5es Encerrados": { bannerUrl: "https://placehold.co/1200x250.png?text=Leiloes+Encerrados", bannerAiHint: "arquivo historico" },
    "Leil\xF5es Cancelados": { bannerUrl: "https://placehold.co/1200x250.png?text=Leiloes+Cancelados", bannerAiHint: "carimbo cancelado" },
    "Default": { bannerUrl: "https://placehold.co/1200x250.png?text=Leiloes", bannerAiHint: "leilao geral" }
  };
  return assets[categoryName] || assets["Default"];
};
var getUniqueLotLocations = (lots) => {
  if (!lots) return [];
  const locations = /* @__PURE__ */ new Set();
  lots.forEach((lot) => {
    if (lot.cityName && lot.stateUf) {
      locations.add(`${lot.cityName} - ${lot.stateUf}`);
    }
  });
  return Array.from(locations).sort();
};
function getEffectiveLotEndDate(lot, auction) {
  if (!lot) return { effectiveLotEndDate: null, effectiveLotStartDate: null };
  if (lot.endDate) {
    return {
      effectiveLotEndDate: lot.endDate ? new Date(lot.endDate) : null,
      effectiveLotStartDate: lot.auctionDate ? new Date(lot.auctionDate) : auction?.auctionDate ? new Date(auction.auctionDate) : null
    };
  }
  if (auction?.auctionStages && auction.auctionStages.length > 0) {
    const now = /* @__PURE__ */ new Date();
    const upcomingOrActiveStage = auction.auctionStages.filter((stage) => stage.endDate && !(0, import_date_fns.isPast)(new Date(stage.endDate))).sort((a, b) => {
      const aStartDate = a.startDate ? new Date(a.startDate) : null;
      const bStartDate = b.startDate ? new Date(b.startDate) : null;
      return (aStartDate?.getTime() || 0) - (bStartDate?.getTime() || 0);
    })[0];
    if (upcomingOrActiveStage?.endDate) {
      return {
        effectiveLotEndDate: upcomingOrActiveStage.endDate ? new Date(upcomingOrActiveStage.endDate) : null,
        effectiveLotStartDate: upcomingOrActiveStage.startDate ? new Date(upcomingOrActiveStage.startDate) : null
      };
    }
    const lastStage = auction.auctionStages.filter((stage) => stage.endDate).sort((a, b) => {
      const aEndDate = a.endDate ? new Date(a.endDate) : null;
      const bEndDate = b.endDate ? new Date(b.endDate) : null;
      return (bEndDate?.getTime() || 0) - (aEndDate?.getTime() || 0);
    })[0];
    if (lastStage?.endDate) {
      return {
        effectiveLotEndDate: lastStage.endDate ? new Date(lastStage.endDate) : null,
        effectiveLotStartDate: lastStage.startDate ? new Date(lastStage.startDate) : null
      };
    }
  }
  if (auction?.endDate) {
    return {
      effectiveLotEndDate: auction.endDate ? new Date(auction.endDate) : null,
      effectiveLotStartDate: auction.auctionDate ? new Date(auction.auctionDate) : null
    };
  }
  return { effectiveLotEndDate: null, effectiveLotStartDate: null };
}
var getActiveStage = (stages) => {
  if (!stages || stages.length === 0) {
    return null;
  }
  const now = /* @__PURE__ */ new Date();
  const activeStages = stages.filter((stage) => {
    const startDate = stage.startDate ? new Date(stage.startDate) : null;
    const endDate = stage.endDate ? new Date(stage.endDate) : null;
    return startDate && endDate && !(0, import_date_fns.isFuture)(startDate) && (0, import_date_fns.isFuture)(endDate);
  });
  if (activeStages.length > 1) {
    return activeStages.sort((a, b) => {
      const aStartDate = a.startDate ? new Date(a.startDate) : null;
      const bStartDate = b.startDate ? new Date(b.startDate) : null;
      return (bStartDate?.getTime() || 0) - (aStartDate?.getTime() || 0);
    })[0];
  }
  return activeStages[0] || null;
};
var getLotPriceForStage = (lot, activeStageId) => {
  if (!lot) return null;
  if (activeStageId && lot.stageDetails) {
    const stagePrice = lot.stageDetails.find((p) => p.auctionStageId === activeStageId);
    if (stagePrice) {
      return {
        initialBid: stagePrice.initialBid,
        bidIncrement: stagePrice.increment
      };
    }
  }
  return {
    initialBid: lot.initialPrice,
    bidIncrement: lot.bidIncrementStep
  };
};

// src/lib/favorite-store.ts
var FAVORITE_LOTS_KEY = "bidExpertFavoriteLotIds";
function getFavoriteLotIdsFromStorage() {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(FAVORITE_LOTS_KEY);
  try {
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Error parsing favorite lots from localStorage", e);
    return [];
  }
}
function addFavoriteLotIdToStorage(lotId) {
  if (typeof window === "undefined" || !lotId) return;
  let ids = getFavoriteLotIdsFromStorage();
  if (!ids.includes(lotId)) {
    ids.push(lotId);
    localStorage.setItem(FAVORITE_LOTS_KEY, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent("favorites-updated"));
  }
}
function removeFavoriteLotIdFromStorage(lotId) {
  if (typeof window === "undefined" || !lotId) return;
  let ids = getFavoriteLotIdsFromStorage();
  const initialLength = ids.length;
  ids = ids.filter((id) => id !== lotId);
  if (ids.length < initialLength) {
    localStorage.setItem(FAVORITE_LOTS_KEY, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent("favorites-updated"));
  }
}
function isLotFavoriteInStorage(lotId) {
  if (typeof window === "undefined" || !lotId) return false;
  const ids = getFavoriteLotIdsFromStorage();
  return ids.includes(lotId);
}

// src/lib/recently-viewed-store.ts
var RECENTLY_VIEWED_KEY = "recentlyViewedLots";
var MAX_RECENTLY_VIEWED = 10;
var EXPIRATION_DAYS = 3;
function getRecentlyViewedIds() {
  if (typeof window === "undefined") {
    return [];
  }
  const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
  try {
    const parsed = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(parsed)) return [];
    const now = Date.now();
    const expirationTime = EXPIRATION_DAYS * 24 * 60 * 60 * 1e3;
    const validItems = parsed.filter((item) => {
      const itemTimestamp = item.timestamp || 0;
      return now - itemTimestamp < expirationTime;
    });
    if (validItems.length < parsed.length) {
      localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(validItems));
    }
    return validItems.map((item) => item.id);
  } catch (e) {
    console.error("Error parsing recently viewed lots from localStorage", e);
    return [];
  }
}
function addRecentlyViewedId(lotId) {
  if (typeof window === "undefined" || !lotId) {
    return;
  }
  let items = [];
  const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
  try {
    const parsed = stored ? JSON.parse(stored) : [];
    if (Array.isArray(parsed)) {
      items = parsed;
    }
  } catch (e) {
    items = [];
  }
  items = items.filter((item) => item.id !== lotId);
  items.unshift({ id: lotId, timestamp: Date.now() });
  const updatedItems = items.slice(0, MAX_RECENTLY_VIEWED);
  localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updatedItems));
}
function removeRecentlyViewedId(lotId) {
  if (typeof window === "undefined" || !lotId) return;
  let items = [];
  const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
  try {
    const parsed = stored ? JSON.parse(stored) : [];
    if (Array.isArray(parsed)) {
      items = parsed;
    }
  } catch (e) {
    items = [];
  }
  const updatedItems = items.filter((item) => item.id !== lotId);
  localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updatedItems));
  window.dispatchEvent(new CustomEvent("recently-viewed-updated"));
}

// src/components/ui/accordion.tsx
var React = __toESM(require("react"));
var AccordionPrimitive = __toESM(require("@radix-ui/react-accordion"));
var import_lucide_react2 = require("lucide-react");
var import_jsx_runtime = require("react/jsx-runtime");
var Accordion = AccordionPrimitive.Root;
var AccordionItem = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
  AccordionPrimitive.Item,
  {
    ref,
    className: cn("border-b", className),
    ...props
  }
));
AccordionItem.displayName = "AccordionItem";
var AccordionTrigger = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccordionPrimitive.Header, { className: "flex", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
  AccordionPrimitive.Trigger,
  {
    ref,
    className: cn(
      "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_lucide_react2.ChevronDown, { className: "h-4 w-4 shrink-0 transition-transform duration-200" })
    ]
  }
) }));
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;
var AccordionContent = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
  AccordionPrimitive.Content,
  {
    ref,
    className: "overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
    ...props,
    children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: cn("pb-4 pt-0", className), children })
  }
));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

// src/components/ui/alert.tsx
var React2 = __toESM(require("react"));
var import_class_variance_authority = require("class-variance-authority");
var import_jsx_runtime2 = require("react/jsx-runtime");
var alertVariants = (0, import_class_variance_authority.cva)(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
var Alert = React2.forwardRef(({ className, variant, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
  "div",
  {
    ref,
    role: "alert",
    className: cn(alertVariants({ variant }), className),
    ...props
  }
));
Alert.displayName = "Alert";
var AlertTitle = React2.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
  "h5",
  {
    ref,
    className: cn("mb-1 font-medium leading-none tracking-tight", className),
    ...props
  }
));
AlertTitle.displayName = "AlertTitle";
var AlertDescription = React2.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
  "div",
  {
    ref,
    className: cn("text-sm [&_p]:leading-relaxed", className),
    ...props
  }
));
AlertDescription.displayName = "AlertDescription";

// src/components/ui/alert-dialog.tsx
var React4 = __toESM(require("react"));
var AlertDialogPrimitive = __toESM(require("@radix-ui/react-alert-dialog"));

// src/components/ui/button.tsx
var React3 = __toESM(require("react"));
var import_react_slot = require("@radix-ui/react-slot");
var import_class_variance_authority2 = require("class-variance-authority");
var import_jsx_runtime3 = require("react/jsx-runtime");
var buttonVariants = (0, import_class_variance_authority2.cva)(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
var Button = React3.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? import_react_slot.Slot : "button";
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      Comp,
      {
        className: cn(buttonVariants({ variant, size, className })),
        ref,
        ...props
      }
    );
  }
);
Button.displayName = "Button";

// src/components/ui/alert-dialog.tsx
var import_jsx_runtime4 = require("react/jsx-runtime");
var AlertDialog = AlertDialogPrimitive.Root;
var AlertDialogTrigger = AlertDialogPrimitive.Trigger;
var AlertDialogPortal = AlertDialogPrimitive.Portal;
var AlertDialogOverlay = React4.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
  AlertDialogPrimitive.Overlay,
  {
    className: cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    ),
    ...props,
    ref
  }
));
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;
var AlertDialogContent = React4.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(AlertDialogPortal, { children: [
  /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(AlertDialogOverlay, {}),
  /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
    AlertDialogPrimitive.Content,
    {
      ref,
      className: cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      ),
      ...props
    }
  )
] }));
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;
var AlertDialogHeader = ({
  className,
  ...props
}) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
  "div",
  {
    className: cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    ),
    ...props
  }
);
AlertDialogHeader.displayName = "AlertDialogHeader";
var AlertDialogFooter = ({
  className,
  ...props
}) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
  "div",
  {
    className: cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    ),
    ...props
  }
);
AlertDialogFooter.displayName = "AlertDialogFooter";
var AlertDialogTitle = React4.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
  AlertDialogPrimitive.Title,
  {
    ref,
    className: cn("text-lg font-semibold", className),
    ...props
  }
));
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;
var AlertDialogDescription = React4.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
  AlertDialogPrimitive.Description,
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName;
var AlertDialogAction = React4.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
  AlertDialogPrimitive.Action,
  {
    ref,
    className: cn(buttonVariants(), className),
    ...props
  }
));
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;
var AlertDialogCancel = React4.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
  AlertDialogPrimitive.Cancel,
  {
    ref,
    className: cn(
      buttonVariants({ variant: "outline" }),
      "mt-2 sm:mt-0",
      className
    ),
    ...props
  }
));
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;

// src/components/ui/avatar.tsx
var React5 = __toESM(require("react"));
var AvatarPrimitive = __toESM(require("@radix-ui/react-avatar"));
var import_jsx_runtime5 = require("react/jsx-runtime");
var Avatar = React5.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
  AvatarPrimitive.Root,
  {
    ref,
    className: cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    ),
    ...props
  }
));
Avatar.displayName = AvatarPrimitive.Root.displayName;
var AvatarImage = React5.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
  AvatarPrimitive.Image,
  {
    ref,
    className: cn("aspect-square h-full w-full", className),
    ...props
  }
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;
var AvatarFallback = React5.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
  AvatarPrimitive.Fallback,
  {
    ref,
    className: cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    ),
    ...props
  }
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

// src/components/ui/badge.tsx
var import_class_variance_authority3 = require("class-variance-authority");
var import_jsx_runtime6 = require("react/jsx-runtime");
var badgeVariants = (0, import_class_variance_authority3.cva)(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
function Badge({ className, variant, ...props }) {
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: cn(badgeVariants({ variant }), "whitespace-nowrap", className), ...props });
}

// src/components/ui/calendar.tsx
var import_lucide_react3 = require("lucide-react");
var import_react_day_picker = require("react-day-picker");
var import_jsx_runtime7 = require("react/jsx-runtime");
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
    import_react_day_picker.DayPicker,
    {
      showOutsideDays,
      className: cn("p-3", className),
      classNames: {
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-accent-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames
      },
      components: {
        IconLeft: ({ ...props2 }) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_lucide_react3.ChevronLeft, { className: "h-4 w-4" }),
        IconRight: ({ ...props2 }) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_lucide_react3.ChevronRight, { className: "h-4 w-4" })
      },
      ...props
    }
  );
}
Calendar.displayName = "Calendar";

// src/components/ui/card.tsx
var React6 = __toESM(require("react"));
var import_jsx_runtime8 = require("react/jsx-runtime");
var Card = React6.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
  "div",
  {
    ref,
    className: cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    ),
    ...props
  }
));
Card.displayName = "Card";
var CardHeader = React6.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
  "div",
  {
    ref,
    className: cn("flex flex-col space-y-1.5 p-6", className),
    ...props
  }
));
CardHeader.displayName = "CardHeader";
var CardTitle = React6.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
  "h3",
  {
    ref,
    className: cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    ),
    ...props
  }
));
CardTitle.displayName = "CardTitle";
var CardDescription = React6.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
  "p",
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
CardDescription.displayName = "CardDescription";
var CardContent = React6.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { ref, className: cn("p-6 pt-0", className), ...props }));
CardContent.displayName = "CardContent";
var CardFooter = React6.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
  "div",
  {
    ref,
    className: cn("flex items-center p-6 pt-0", className),
    ...props
  }
));
CardFooter.displayName = "CardFooter";

// src/components/ui/checkbox.tsx
var React7 = __toESM(require("react"));
var CheckboxPrimitive = __toESM(require("@radix-ui/react-checkbox"));
var import_lucide_react4 = require("lucide-react");
var import_jsx_runtime9 = require("react/jsx-runtime");
var Checkbox = React7.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
  CheckboxPrimitive.Root,
  {
    ref,
    className: cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    ),
    ...props,
    children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      CheckboxPrimitive.Indicator,
      {
        className: cn("flex items-center justify-center text-current"),
        children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(import_lucide_react4.Check, { className: "h-4 w-4" })
      }
    )
  }
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

// src/components/ui/command.tsx
var React9 = __toESM(require("react"));
var import_cmdk = require("cmdk");
var import_lucide_react6 = require("lucide-react");

// src/components/ui/dialog.tsx
var React8 = __toESM(require("react"));
var DialogPrimitive = __toESM(require("@radix-ui/react-dialog"));
var import_lucide_react5 = require("lucide-react");
var import_jsx_runtime10 = require("react/jsx-runtime");
var Dialog = DialogPrimitive.Root;
var DialogPortal = DialogPrimitive.Portal;
var DialogContent = React8.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(DialogPortal, { children: [
  /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
    DialogPrimitive.Overlay,
    {
      className: cn(
        "fixed inset-0 z-50 bg-background/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
      )
    }
  ),
  /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
    DialogPrimitive.Content,
    {
      ref,
      className: cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      ),
      ...props,
      children: [
        children,
        /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
          DialogPrimitive.Close,
          {
            className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(import_lucide_react5.X, { className: "h-4 w-4" }),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "sr-only", children: "Close" })
            ]
          }
        )
      ]
    }
  )
] }));
DialogContent.displayName = DialogPrimitive.Content.displayName;
var DialogDescription = React8.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
  DialogPrimitive.Description,
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;
var DialogFooter = ({
  className,
  ...props
}) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
  "div",
  {
    className: cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    ),
    ...props
  }
);
DialogFooter.displayName = "DialogFooter";
var DialogHeader = ({
  className,
  ...props
}) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
  "div",
  {
    className: cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    ),
    ...props
  }
);
DialogHeader.displayName = "DialogHeader";
var DialogTitle = React8.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
  DialogPrimitive.Title,
  {
    ref,
    className: cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    ),
    ...props
  }
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

// src/components/ui/command.tsx
var import_jsx_runtime11 = require("react/jsx-runtime");
var Command = React9.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
  import_cmdk.Command,
  {
    ref,
    className: cn(
      "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
      className
    ),
    ...props
  }
));
Command.displayName = import_cmdk.Command.displayName;
var CommandDialog = ({ children, ...props }) => {
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Dialog, { ...props, children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(DialogContent, { className: "overflow-hidden p-0 shadow-lg", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Command, { className: "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5", children }) }) });
};
var CommandInput = React9.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "flex items-center border-b px-3", "cmdk-input-wrapper": "", children: [
  /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_lucide_react6.Search, { className: "mr-2 h-4 w-4 shrink-0 opacity-50" }),
  /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
    import_cmdk.Command.Input,
    {
      ref,
      className: cn(
        "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className
      ),
      ...props
    }
  )
] }));
CommandInput.displayName = import_cmdk.Command.Input.displayName;
var CommandList = React9.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
  import_cmdk.Command.List,
  {
    ref,
    className: cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className),
    ...props
  }
));
CommandList.displayName = import_cmdk.Command.List.displayName;
var CommandEmpty = React9.forwardRef((props, ref) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
  import_cmdk.Command.Empty,
  {
    ref,
    className: "py-6 text-center text-sm",
    ...props
  }
));
CommandEmpty.displayName = import_cmdk.Command.Empty.displayName;
var CommandGroup = React9.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
  import_cmdk.Command.Group,
  {
    ref,
    className: cn(
      "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
      className
    ),
    ...props
  }
));
CommandGroup.displayName = import_cmdk.Command.Group.displayName;
var CommandSeparator = React9.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
  import_cmdk.Command.Separator,
  {
    ref,
    className: cn("-mx-1 h-px bg-border", className),
    ...props
  }
));
CommandSeparator.displayName = import_cmdk.Command.Separator.displayName;
var CommandItem = React9.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
  import_cmdk.Command.Item,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    ...props
  }
));
CommandItem.displayName = import_cmdk.Command.Item.displayName;
var CommandShortcut = ({
  className,
  ...props
}) => {
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
    "span",
    {
      className: cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      ),
      ...props
    }
  );
};
CommandShortcut.displayName = "CommandShortcut";

// src/components/ui/dropdown-menu.tsx
var React10 = __toESM(require("react"));
var DropdownMenuPrimitive = __toESM(require("@radix-ui/react-dropdown-menu"));
var import_lucide_react7 = require("lucide-react");
var import_jsx_runtime12 = require("react/jsx-runtime");
var DropdownMenu = DropdownMenuPrimitive.Root;
var DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
var DropdownMenuGroup = DropdownMenuPrimitive.Group;
var DropdownMenuPortal = DropdownMenuPrimitive.Portal;
var DropdownMenuSub = DropdownMenuPrimitive.Sub;
var DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;
var DropdownMenuSubTrigger = React10.forwardRef(({ className, inset, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(
  DropdownMenuPrimitive.SubTrigger,
  {
    ref,
    className: cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent",
      inset && "pl-8",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(import_lucide_react7.ChevronRight, { className: "ml-auto h-4 w-4" })
    ]
  }
));
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;
var DropdownMenuSubContent = React10.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
  DropdownMenuPrimitive.SubContent,
  {
    ref,
    className: cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
      className
    ),
    ...props
  }
));
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;
var DropdownMenuContent = React10.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(DropdownMenuPrimitive.Portal, { children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
  DropdownMenuPrimitive.Content,
  {
    ref,
    sideOffset,
    className: cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
      className
    ),
    ...props
  }
) }));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;
var DropdownMenuItem = React10.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
  DropdownMenuPrimitive.Item,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    ),
    ...props
  }
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;
var DropdownMenuCheckboxItem = React10.forwardRef(({ className, children, checked, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(
  DropdownMenuPrimitive.CheckboxItem,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    checked,
    ...props,
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(DropdownMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(import_lucide_react7.Check, { className: "h-4 w-4" }) }) }),
      children
    ]
  }
));
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;
var DropdownMenuRadioItem = React10.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(
  DropdownMenuPrimitive.RadioItem,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(DropdownMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(import_lucide_react7.Dot, { className: "h-4 w-4 fill-current" }) }) }),
      children
    ]
  }
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;
var DropdownMenuLabel = React10.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
  DropdownMenuPrimitive.Label,
  {
    ref,
    className: cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    ),
    ...props
  }
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;
var DropdownMenuSeparator = React10.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
  DropdownMenuPrimitive.Separator,
  {
    ref,
    className: cn("-mx-1 my-1 h-px bg-muted", className),
    ...props
  }
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;
var DropdownMenuShortcut = ({
  className,
  ...props
}) => {
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
    "span",
    {
      className: cn("ml-auto text-xs tracking-widest opacity-60", className),
      ...props
    }
  );
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

// src/components/ui/form.tsx
var React12 = __toESM(require("react"));
var import_react_slot2 = require("@radix-ui/react-slot");
var import_react_hook_form = require("react-hook-form");

// src/components/ui/label.tsx
var React11 = __toESM(require("react"));
var LabelPrimitive = __toESM(require("@radix-ui/react-label"));
var import_class_variance_authority4 = require("class-variance-authority");
var import_jsx_runtime13 = require("react/jsx-runtime");
var labelVariants = (0, import_class_variance_authority4.cva)(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);
var Label2 = React11.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
  LabelPrimitive.Root,
  {
    ref,
    className: cn(labelVariants(), className),
    ...props
  }
));
Label2.displayName = LabelPrimitive.Root.displayName;

// src/components/ui/form.tsx
var import_jsx_runtime14 = require("react/jsx-runtime");
var Form = import_react_hook_form.FormProvider;
var FormField = (props) => {
  return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
    import_react_hook_form.Controller,
    {
      ...props,
      render: ({ field, fieldState, formState }) => {
        return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
          FormContext.Provider,
          {
            value: {
              name: props.name,
              formLabel: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(FormLabel, {}),
              field,
              fieldState,
              formState
            },
            children: props.render({ field, fieldState, formState })
          }
        );
      }
    }
  );
};
var FormContext = React12.createContext(void 0);
function useFormField() {
  const fieldContext = React12.useContext(FormContext);
  const itemContext = React12.useContext(FormItemContext);
  const { getFieldState, formState } = (0, import_react_hook_form.useFormContext)();
  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }
  const fieldState = getFieldState(fieldContext.name, formState);
  return {
    id: itemContext.id,
    formItemId: `${itemContext.id}-form-item`,
    formDescriptionId: `${itemContext.id}-form-item-description`,
    formMessageId: `${itemContext.id}-form-item-message`,
    ...fieldContext,
    ...fieldState
  };
}
var FormItemContext = React12.createContext(
  {}
);
var FormItem = React12.forwardRef(({ className, ...props }, ref) => {
  const id = React12.useId();
  return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(FormItemContext.Provider, { value: { id }, children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { ref, className: cn("space-y-2", className), ...props }) });
});
FormItem.displayName = "FormItem";
var FormLabel = React12.forwardRef(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField();
  return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
    Label2,
    {
      ref,
      className: cn(error && "text-destructive", className),
      htmlFor: formItemId,
      ...props
    }
  );
});
FormLabel.displayName = "FormLabel";
var FormControl = React12.forwardRef(({ ...props }, ref) => {
  const { formItemId, field, fieldState } = useFormField();
  return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
    import_react_slot2.Slot,
    {
      ref,
      id: formItemId,
      "aria-describedby": !fieldState.invalid ? `${formItemId}-description` : `${formItemId}-message`,
      "aria-invalid": fieldState.invalid,
      onChange: field.onChange,
      onBlur: field.onBlur,
      ...props
    }
  );
});
FormControl.displayName = "FormControl";
var FormDescription = React12.forwardRef(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField();
  return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
    "p",
    {
      ref,
      id: formDescriptionId,
      className: cn("text-[0.8rem] text-muted-foreground", className),
      ...props
    }
  );
});
FormDescription.displayName = "FormDescription";
var FormMessage = React12.forwardRef(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message) : children;
  if (!body) {
    return null;
  }
  return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
    "p",
    {
      ref,
      id: formMessageId,
      className: cn("text-[0.8rem] font-medium text-destructive", className),
      ...props,
      children: body
    }
  );
});
FormMessage.displayName = "FormMessage";

// src/components/ui/input.tsx
var React13 = __toESM(require("react"));
var import_jsx_runtime15 = require("react/jsx-runtime");
var Input = React13.forwardRef(
  ({ className, type, ...props }, ref) => {
    return /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
      "input",
      {
        type,
        className: cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        ),
        ref,
        ...props
      }
    );
  }
);
Input.displayName = "Input";

// src/components/ui/menubar.tsx
var React14 = __toESM(require("react"));
var MenubarPrimitive = __toESM(require("@radix-ui/react-menubar"));
var import_lucide_react8 = require("lucide-react");
var import_jsx_runtime16 = require("react/jsx-runtime");
function MenubarMenu({
  ...props
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(MenubarPrimitive.Menu, { ...props });
}
function MenubarGroup({
  ...props
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(MenubarPrimitive.Group, { ...props });
}
function MenubarPortal({
  ...props
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(MenubarPrimitive.Portal, { ...props });
}
function MenubarRadioGroup({
  ...props
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(MenubarPrimitive.RadioGroup, { ...props });
}
function MenubarSub({
  ...props
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(MenubarPrimitive.Sub, { "data-slot": "menubar-sub", ...props });
}
var Menubar = React14.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
  MenubarPrimitive.Root,
  {
    ref,
    className: cn(
      "flex h-10 items-center space-x-1 rounded-md border bg-background p-1",
      className
    ),
    ...props
  }
));
Menubar.displayName = MenubarPrimitive.Root.displayName;
var MenubarTrigger = React14.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
  MenubarPrimitive.Trigger,
  {
    ref,
    className: cn(
      "flex cursor-default select-none items-center rounded-sm px-3 py-1.5 text-sm font-medium outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
      className
    ),
    ...props
  }
));
MenubarTrigger.displayName = MenubarPrimitive.Trigger.displayName;
var MenubarSubTrigger = React14.forwardRef(({ className, inset, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(
  MenubarPrimitive.SubTrigger,
  {
    ref,
    className: cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
      inset && "pl-8",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(import_lucide_react8.ChevronRight, { className: "ml-auto h-4 w-4" })
    ]
  }
));
MenubarSubTrigger.displayName = MenubarPrimitive.SubTrigger.displayName;
var MenubarSubContent = React14.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
  MenubarPrimitive.SubContent,
  {
    ref,
    className: cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    ),
    ...props
  }
));
MenubarSubContent.displayName = MenubarPrimitive.SubContent.displayName;
var MenubarContent = React14.forwardRef(
  ({ className, align = "start", alignOffset = -4, sideOffset = 8, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(MenubarPrimitive.Portal, { children: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
    MenubarPrimitive.Content,
    {
      ref,
      align,
      alignOffset,
      sideOffset,
      className: cn(
        "z-50 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      ),
      ...props
    }
  ) })
);
MenubarContent.displayName = MenubarPrimitive.Content.displayName;
var MenubarItem = React14.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
  MenubarPrimitive.Item,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    ),
    ...props
  }
));
MenubarItem.displayName = MenubarPrimitive.Item.displayName;
var MenubarCheckboxItem = React14.forwardRef(({ className, children, checked, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(
  MenubarPrimitive.CheckboxItem,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    checked,
    ...props,
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(MenubarPrimitive.ItemIndicator, { children: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(import_lucide_react8.Check, { className: "h-4 w-4" }) }) }),
      children
    ]
  }
));
MenubarCheckboxItem.displayName = MenubarPrimitive.CheckboxItem.displayName;
var MenubarRadioItem = React14.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(
  MenubarPrimitive.RadioItem,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(MenubarPrimitive.ItemIndicator, { children: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(import_lucide_react8.Circle, { className: "h-2 w-2 fill-current" }) }) }),
      children
    ]
  }
));
MenubarRadioItem.displayName = MenubarPrimitive.RadioItem.displayName;
var MenubarLabel = React14.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
  MenubarPrimitive.Label,
  {
    ref,
    className: cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    ),
    ...props
  }
));
MenubarLabel.displayName = MenubarPrimitive.Label.displayName;
var MenubarSeparator = React14.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
  MenubarPrimitive.Separator,
  {
    ref,
    className: cn("-mx-1 my-1 h-px bg-muted", className),
    ...props
  }
));
MenubarSeparator.displayName = MenubarPrimitive.Separator.displayName;
var MenubarShortcut = ({
  className,
  ...props
}) => {
  return /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
    "span",
    {
      className: cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      ),
      ...props
    }
  );
};
MenubarShortcut.displayname = "MenubarShortcut";

// src/components/ui/navigation-menu.tsx
var React15 = __toESM(require("react"));
var NavigationMenuPrimitive = __toESM(require("@radix-ui/react-navigation-menu"));
var import_class_variance_authority5 = require("class-variance-authority");
var import_lucide_react9 = require("lucide-react");
var import_jsx_runtime17 = require("react/jsx-runtime");
var NavigationMenu = React15.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)(
  NavigationMenuPrimitive.Root,
  {
    ref,
    className: cn(
      "relative z-10 flex items-center justify-start",
      // Removido max-w-max, flex-1 e justify-center
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(NavigationMenuViewport, {})
    ]
  }
));
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName;
var NavigationMenuList = React15.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(
  NavigationMenuPrimitive.List,
  {
    ref,
    className: cn(
      "group flex list-none items-center justify-start space-x-1",
      // Alterado de justify-center para justify-start
      className
    ),
    ...props
  }
));
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName;
var NavigationMenuItem = NavigationMenuPrimitive.Item;
var navigationMenuTriggerStyle = (0, import_class_variance_authority5.cva)(
  "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
);
var NavigationMenuTrigger = React15.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)(
  NavigationMenuPrimitive.Trigger,
  {
    ref,
    className: cn(navigationMenuTriggerStyle(), "group", className),
    ...props,
    children: [
      children,
      " ",
      /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(
        import_lucide_react9.ChevronDown,
        {
          className: "relative top-[1px] ml-1 h-3 w-3 transition duration-200 group-data-[state=open]:rotate-180",
          "aria-hidden": "true"
        }
      )
    ]
  }
));
NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName;
var NavigationMenuContent = React15.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(
  NavigationMenuPrimitive.Content,
  {
    ref,
    className: cn(
      "top-0 w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 md:absolute md:w-auto ",
      // Removido "left-0"
      className
    ),
    ...props
  }
));
NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName;
var NavigationMenuLink = NavigationMenuPrimitive.Link;
var NavigationMenuViewport = React15.forwardRef(({ className, align = "start", ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("div", { className: cn("absolute top-full flex", {
  "justify-start": align === "start",
  "justify-center": align === "center",
  "justify-end": align === "end"
}), children: /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(
  NavigationMenuPrimitive.Viewport,
  {
    className: cn(
      "origin-top-center relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 md:w-[var(--radix-navigation-menu-viewport-width)]",
      className
    ),
    ref,
    ...props
  }
) }));
NavigationMenuViewport.displayName = NavigationMenuPrimitive.Viewport.displayName;
var NavigationMenuIndicator = React15.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(
  NavigationMenuPrimitive.Indicator,
  {
    ref,
    className: cn(
      "top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:fade-in",
      className
    ),
    ...props,
    children: /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("div", { className: "relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm bg-border shadow-md" })
  }
));
NavigationMenuIndicator.displayName = NavigationMenuPrimitive.Indicator.displayName;

// src/components/ui/popover.tsx
var React16 = __toESM(require("react"));
var PopoverPrimitive = __toESM(require("@radix-ui/react-popover"));
var import_jsx_runtime18 = require("react/jsx-runtime");
var Popover = PopoverPrimitive.Root;
var PopoverTrigger = PopoverPrimitive.Trigger;
var PopoverContent = React16.forwardRef(({ className, align = "center", sideOffset = 4, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(PopoverPrimitive.Portal, { children: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
  PopoverPrimitive.Content,
  {
    ref,
    align,
    sideOffset,
    className: cn(
      "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    ),
    ...props
  }
) }));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

// src/components/ui/progress.tsx
var React17 = __toESM(require("react"));
var ProgressPrimitive = __toESM(require("@radix-ui/react-progress"));
var import_jsx_runtime19 = require("react/jsx-runtime");
var Progress = React17.forwardRef(({ className, value, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
  ProgressPrimitive.Root,
  {
    ref,
    className: cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    ),
    ...props,
    children: /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
      ProgressPrimitive.Indicator,
      {
        className: "h-full w-full flex-1 bg-primary transition-all",
        style: { transform: `translateX(-${100 - (value || 0)}%)` }
      }
    )
  }
));
Progress.displayName = ProgressPrimitive.Root.displayName;

// src/components/ui/radio-group.tsx
var React18 = __toESM(require("react"));
var RadioGroupPrimitive = __toESM(require("@radix-ui/react-radio-group"));
var import_lucide_react10 = require("lucide-react");
var import_jsx_runtime20 = require("react/jsx-runtime");
var RadioGroup3 = React18.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(
    RadioGroupPrimitive.Root,
    {
      className: cn("grid gap-2", className),
      ...props,
      ref
    }
  );
});
RadioGroup3.displayName = RadioGroupPrimitive.Root.displayName;
var RadioGroupItem = React18.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(
    RadioGroupPrimitive.Item,
    {
      ref,
      className: cn(
        "aspect-square h-4 w-4 rounded-full border border-border text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      ),
      ...props,
      children: /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(RadioGroupPrimitive.Indicator, { className: "flex items-center justify-center", children: /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(import_lucide_react10.Circle, { className: "h-2.5 w-2.5 fill-current text-current" }) })
    }
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

// src/components/ui/scroll-area.tsx
var React19 = __toESM(require("react"));
var ScrollAreaPrimitive = __toESM(require("@radix-ui/react-scroll-area"));
var import_jsx_runtime21 = require("react/jsx-runtime");
var ScrollArea = React19.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)(
  ScrollAreaPrimitive.Root,
  {
    ref,
    className: cn("relative overflow-hidden", className),
    ...props,
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(ScrollAreaPrimitive.Viewport, { className: "h-full w-full rounded-[inherit]", children }),
      /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(ScrollBar, {}),
      /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(ScrollAreaPrimitive.Corner, {})
    ]
  }
));
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;
var ScrollBar = React19.forwardRef(({ className, orientation = "vertical", ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(
  ScrollAreaPrimitive.ScrollAreaScrollbar,
  {
    ref,
    orientation,
    className: cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    ),
    ...props,
    children: /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(ScrollAreaPrimitive.ScrollAreaThumb, { className: "relative flex-1 rounded-full bg-border" })
  }
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

// src/components/ui/select.tsx
var React20 = __toESM(require("react"));
var SelectPrimitive = __toESM(require("@radix-ui/react-select"));
var import_lucide_react11 = require("lucide-react");
var import_jsx_runtime22 = require("react/jsx-runtime");
var Select = SelectPrimitive.Root;
var SelectGroup = SelectPrimitive.Group;
var SelectValue = SelectPrimitive.Value;
var SelectTrigger = React20.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)(
  SelectPrimitive.Trigger,
  {
    ref,
    className: cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(SelectPrimitive.Icon, { asChild: true, children: /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(import_lucide_react11.ChevronDown, { className: "h-4 w-4 opacity-50" }) })
    ]
  }
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;
var SelectScrollUpButton = React20.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
  SelectPrimitive.ScrollUpButton,
  {
    ref,
    className: cn(
      "flex cursor-default items-center justify-center py-1",
      className
    ),
    ...props,
    children: /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(import_lucide_react11.ChevronUp, { className: "h-4 w-4" })
  }
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;
var SelectScrollDownButton = React20.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
  SelectPrimitive.ScrollDownButton,
  {
    ref,
    className: cn(
      "flex cursor-default items-center justify-center py-1",
      className
    ),
    ...props,
    children: /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(import_lucide_react11.ChevronDown, { className: "h-4 w-4" })
  }
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;
var SelectContent = React20.forwardRef(({ className, children, position = "popper", ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(SelectPrimitive.Portal, { children: /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)(
  SelectPrimitive.Content,
  {
    ref,
    className: cn(
      "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
      className
    ),
    position,
    ...props,
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(SelectScrollUpButton, {}),
      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
        SelectPrimitive.Viewport,
        {
          className: cn(
            "p-1",
            position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          ),
          children
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(SelectScrollDownButton, {})
    ]
  }
) }));
SelectContent.displayName = SelectPrimitive.Content.displayName;
var SelectLabel = React20.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
  SelectPrimitive.Label,
  {
    ref,
    className: cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className),
    ...props
  }
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;
var SelectItem = React20.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)(
  SelectPrimitive.Item,
  {
    ref,
    className: cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(SelectPrimitive.ItemIndicator, { children: /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(import_lucide_react11.Check, { className: "h-4 w-4" }) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(SelectPrimitive.ItemText, { children })
    ]
  }
));
SelectItem.displayName = SelectPrimitive.Item.displayName;
var SelectSeparator = React20.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
  SelectPrimitive.Separator,
  {
    ref,
    className: cn("-mx-1 my-1 h-px bg-muted", className),
    ...props
  }
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

// src/components/ui/separator.tsx
var React21 = __toESM(require("react"));
var SeparatorPrimitive = __toESM(require("@radix-ui/react-separator"));
var import_jsx_runtime23 = require("react/jsx-runtime");
var Separator4 = React21.forwardRef(
  ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(
    SeparatorPrimitive.Root,
    {
      ref,
      decorative,
      orientation,
      className: cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      ),
      ...props
    }
  )
);
Separator4.displayName = SeparatorPrimitive.Root.displayName;

// src/components/ui/sheet.tsx
var React22 = __toESM(require("react"));
var SheetPrimitive = __toESM(require("@radix-ui/react-dialog"));
var import_class_variance_authority6 = require("class-variance-authority");
var import_lucide_react12 = require("lucide-react");
var import_jsx_runtime24 = require("react/jsx-runtime");
var Sheet = SheetPrimitive.Root;
var SheetTrigger = SheetPrimitive.Trigger;
var SheetClose = SheetPrimitive.Close;
var SheetPortal = SheetPrimitive.Portal;
var SheetOverlay = React22.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
  SheetPrimitive.Overlay,
  {
    className: cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    ),
    ...props,
    ref
  }
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;
var sheetVariants = (0, import_class_variance_authority6.cva)(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom: "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right: "inset-y-0 right-0 h-full w-3/4  border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm"
      }
    },
    defaultVariants: {
      side: "right"
    }
  }
);
var SheetContent = React22.forwardRef(({ side = "right", className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)(SheetPortal, { children: [
  /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(SheetOverlay, {}),
  /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)(
    SheetPrimitive.Content,
    {
      ref,
      className: cn(sheetVariants({ side }), className),
      ...props,
      children: [
        children,
        /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)(SheetPrimitive.Close, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary", children: [
          /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(import_lucide_react12.X, { className: "h-4 w-4" }),
          /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("span", { className: "sr-only", children: "Close" })
        ] })
      ]
    }
  )
] }));
SheetContent.displayName = SheetPrimitive.Content.displayName;
var SheetHeader = ({
  className,
  ...props
}) => /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
  "div",
  {
    className: cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    ),
    ...props
  }
);
SheetHeader.displayName = "SheetHeader";
var SheetFooter = ({
  className,
  ...props
}) => /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
  "div",
  {
    className: cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    ),
    ...props
  }
);
SheetFooter.displayName = "SheetFooter";
var SheetTitle = React22.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
  SheetPrimitive.Title,
  {
    ref,
    className: cn("text-lg font-semibold text-foreground", className),
    ...props
  }
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;
var SheetDescription = React22.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
  SheetPrimitive.Description,
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

// src/components/ui/skeleton.tsx
var import_jsx_runtime25 = require("react/jsx-runtime");
function Skeleton({
  className,
  ...props
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(
    "div",
    {
      className: cn("animate-pulse rounded-md bg-muted", className),
      ...props
    }
  );
}

// src/components/ui/slider.tsx
var React23 = __toESM(require("react"));
var SliderPrimitive = __toESM(require("@radix-ui/react-slider"));
var import_jsx_runtime26 = require("react/jsx-runtime");
var Slider = React23.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime26.jsxs)(
  SliderPrimitive.Root,
  {
    ref,
    className: cn(
      "relative flex w-full touch-none select-none items-center",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ (0, import_jsx_runtime26.jsx)(SliderPrimitive.Track, { className: "relative h-2 w-full grow overflow-hidden rounded-full bg-secondary", children: /* @__PURE__ */ (0, import_jsx_runtime26.jsx)(SliderPrimitive.Range, { className: "absolute h-full bg-primary" }) }),
      /* @__PURE__ */ (0, import_jsx_runtime26.jsx)(SliderPrimitive.Thumb, { className: "block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" })
    ]
  }
));
Slider.displayName = SliderPrimitive.Root.displayName;

// src/components/ui/switch.tsx
var React24 = __toESM(require("react"));
var SwitchPrimitives = __toESM(require("@radix-ui/react-switch"));
var import_jsx_runtime27 = require("react/jsx-runtime");
var Switch = React24.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(
  SwitchPrimitives.Root,
  {
    className: cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    ),
    ...props,
    ref,
    children: /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(
      SwitchPrimitives.Thumb,
      {
        className: cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
        )
      }
    )
  }
));
Switch.displayName = SwitchPrimitives.Root.displayName;

// src/components/ui/table.tsx
var React25 = __toESM(require("react"));
var import_jsx_runtime28 = require("react/jsx-runtime");
var Table = React25.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("div", { className: "relative w-full overflow-auto", children: /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(
  "table",
  {
    ref,
    className: cn("w-full caption-bottom text-sm", className),
    ...props
  }
) }));
Table.displayName = "Table";
var TableHeader = React25.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("thead", { ref, className: cn("[&_tr]:border-b", className), ...props }));
TableHeader.displayName = "TableHeader";
var TableBody = React25.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(
  "tbody",
  {
    ref,
    className: cn("[&_tr:last-child]:border-0", className),
    ...props
  }
));
TableBody.displayName = "TableBody";
var TableFooter = React25.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(
  "tfoot",
  {
    ref,
    className: cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    ),
    ...props
  }
));
TableFooter.displayName = "TableFooter";
var TableRow = React25.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(
  "tr",
  {
    ref,
    className: cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    ),
    ...props
  }
));
TableRow.displayName = "TableRow";
var TableHead = React25.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(
  "th",
  {
    ref,
    className: cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    ),
    ...props
  }
));
TableHead.displayName = "TableHead";
var TableCell = React25.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(
  "td",
  {
    ref,
    className: cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className),
    ...props
  }
));
TableCell.displayName = "TableCell";
var TableCaption = React25.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(
  "caption",
  {
    ref,
    className: cn("mt-4 text-sm text-muted-foreground", className),
    ...props
  }
));
TableCaption.displayName = "TableCaption";

// src/components/ui/tabs.tsx
var React26 = __toESM(require("react"));
var TabsPrimitive = __toESM(require("@radix-ui/react-tabs"));
var import_jsx_runtime29 = require("react/jsx-runtime");
var Tabs = TabsPrimitive.Root;
var TabsList = React26.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(
  TabsPrimitive.List,
  {
    ref,
    className: cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    ),
    ...props
  }
));
TabsList.displayName = TabsPrimitive.List.displayName;
var TabsTrigger = React26.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(
  TabsPrimitive.Trigger,
  {
    ref,
    className: cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    ),
    ...props
  }
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;
var TabsContent = React26.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(
  TabsPrimitive.Content,
  {
    ref,
    className: cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    ),
    ...props
  }
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

// src/components/ui/textarea.tsx
var React27 = __toESM(require("react"));
var import_jsx_runtime30 = require("react/jsx-runtime");
var Textarea = React27.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(
    "textarea",
    {
      className: cn(
        "flex min-h-[80px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      ),
      ref,
      ...props
    }
  );
});
Textarea.displayName = "Textarea";

// src/components/ui/toast.tsx
var React28 = __toESM(require("react"));
var ToastPrimitives = __toESM(require("@radix-ui/react-toast"));
var import_class_variance_authority7 = require("class-variance-authority");
var import_lucide_react13 = require("lucide-react");
var import_jsx_runtime31 = require("react/jsx-runtime");
var ToastProvider = ToastPrimitives.Provider;
var ToastViewport = React28.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime31.jsx)(
  ToastPrimitives.Viewport,
  {
    ref,
    className: cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    ),
    ...props
  }
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;
var toastVariants = (0, import_class_variance_authority7.cva)(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive: "destructive group border-destructive bg-destructive text-destructive-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
var Toast = React28.forwardRef(({ className, variant, ...props }, ref) => {
  return /* @__PURE__ */ (0, import_jsx_runtime31.jsx)(
    ToastPrimitives.Root,
    {
      ref,
      className: cn(toastVariants({ variant }), className),
      ...props
    }
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;
var ToastAction = React28.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime31.jsx)(
  ToastPrimitives.Action,
  {
    ref,
    className: cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    ),
    ...props
  }
));
ToastAction.displayName = ToastPrimitives.Action.displayName;
var ToastClose = React28.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime31.jsx)(
  ToastPrimitives.Close,
  {
    ref,
    className: cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    ),
    "toast-close": "",
    ...props,
    children: /* @__PURE__ */ (0, import_jsx_runtime31.jsx)(import_lucide_react13.X, { className: "h-4 w-4" })
  }
));
ToastClose.displayName = ToastPrimitives.Close.displayName;
var ToastTitle = React28.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime31.jsx)(
  ToastPrimitives.Title,
  {
    ref,
    className: cn("text-sm font-semibold", className),
    ...props
  }
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;
var ToastDescription = React28.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime31.jsx)(
  ToastPrimitives.Description,
  {
    ref,
    className: cn("text-sm opacity-90", className),
    ...props
  }
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

// src/components/ui/toaster.tsx
var React29 = __toESM(require("react"));
var import_lucide_react14 = require("lucide-react");
var import_jsx_runtime32 = require("react/jsx-runtime");
var getTextContent = (node) => {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (node === null || typeof node === "boolean" || node === void 0) return "";
  if (Array.isArray(node)) {
    return node.map(getTextContent).join("");
  }
  if (React29.isValidElement(node) && node.props.children) {
    return getTextContent(node.props.children);
  }
  return "";
};
function ToastComponent({ id, title, description, action, variant, ...props }) {
  const [hasCopied, setHasCopied] = React29.useState(false);
  const fullErrorText = React29.useMemo(() => {
    const titleText = getTextContent(title);
    const descriptionText = getTextContent(description);
    return `${titleText ? titleText + "\n" : ""}${descriptionText || ""}`.trim();
  }, [title, description]);
  const handleCopy = () => {
    if (fullErrorText) {
      navigator.clipboard.writeText(fullErrorText);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2e3);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(import_jsx_runtime32.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)(Toast, { variant, ...props, className: "flex-col items-start gap-2", children: [
    /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("div", { className: "w-full flex justify-between items-start gap-2", children: [
      /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("div", { className: "grid gap-1 flex-grow", children: title && /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(ToastTitle, { children: title }) }),
      /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("div", { className: "flex flex-col gap-2 self-start flex-shrink-0", children: /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(
        Button,
        {
          size: "icon",
          variant: "ghost",
          className: "h-7 w-7 text-muted-foreground hover:bg-secondary",
          onClick: handleCopy,
          "aria-label": "Copiar notifica\xE7\xE3o",
          children: hasCopied ? /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(import_lucide_react14.Check, { className: "h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(import_lucide_react14.Copy, { className: "h-4 w-4" })
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(ToastClose, {})
    ] }),
    description && /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(ScrollArea, { className: "w-full max-h-[200px] pr-4", children: /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(ToastDescription, { className: "text-xs whitespace-pre-wrap", children: description }) })
  ] }, id) });
}
function Toaster() {
  const toasts = [];
  return /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)(ToastProvider, { children: [
    toasts.map((toastProps) => /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(ToastComponent, { ...toastProps }, toastProps.id)),
    /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(ToastViewport, {})
  ] });
}

// src/components/ui/tooltip.tsx
var React30 = __toESM(require("react"));
var TooltipPrimitive = __toESM(require("@radix-ui/react-tooltip"));
var import_jsx_runtime33 = require("react/jsx-runtime");
var TooltipProvider = TooltipPrimitive.Provider;
var Tooltip = TooltipPrimitive.Root;
var TooltipTrigger = TooltipPrimitive.Trigger;
var TooltipContent = React30.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(
  TooltipPrimitive.Content,
  {
    ref,
    sideOffset,
    className: cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    ),
    ...props
  }
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

// src/components/ui/data-table.tsx
var React31 = __toESM(require("react"));
var import_react_table = require("@tanstack/react-table");
var import_lucide_react19 = require("lucide-react");

// src/components/ui/data-table-toolbar.tsx
var import_lucide_react17 = require("lucide-react");

// src/components/ui/data-table-view-options.tsx
var import_react_dropdown_menu = require("@radix-ui/react-dropdown-menu");
var import_lucide_react15 = require("lucide-react");
var import_jsx_runtime34 = require("react/jsx-runtime");
var getColumnHeader = (column) => {
  const columnDef = column.columnDef;
  if (typeof columnDef.header === "string") {
    return columnDef.header;
  }
  return column.id;
};
function DataTableViewOptions({
  table
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)(DropdownMenu, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(import_react_dropdown_menu.DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)(
      Button,
      {
        variant: "outline",
        size: "sm",
        className: "ml-auto hidden h-8 lg:flex",
        "data-ai-id": "data-table-view-options-button",
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(import_lucide_react15.SlidersHorizontal, { className: "mr-2 h-4 w-4" }),
          "Visualiza\xE7\xE3o"
        ]
      }
    ) }),
    /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)(DropdownMenuContent, { align: "end", className: "w-[150px]", children: [
      /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(DropdownMenuLabel, { children: "Alternar Colunas" }),
      /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(DropdownMenuSeparator, {}),
      table.getAllColumns().filter(
        (column) => typeof column.accessorFn !== "undefined" && column.getCanHide()
      ).map((column) => {
        const columnHeader = getColumnHeader(column);
        return /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(
          DropdownMenuCheckboxItem,
          {
            className: "capitalize",
            checked: column.getIsVisible(),
            onCheckedChange: (value) => column.toggleVisibility(!!value),
            children: columnHeader
          },
          column.id
        );
      })
    ] })
  ] });
}

// src/components/ui/data-table-faceted-filter.tsx
var import_lucide_react16 = require("lucide-react");
var import_jsx_runtime35 = require("react/jsx-runtime");
function DataTableFacetedFilter({
  column,
  title,
  options
}) {
  const facets = column?.getFacetedUniqueValues();
  const selectedValues = new Set(column?.getFilterValue());
  return /* @__PURE__ */ (0, import_jsx_runtime35.jsxs)(Popover, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ (0, import_jsx_runtime35.jsxs)(Button, { variant: "outline", size: "sm", className: "h-8 border-dashed", children: [
      /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(import_lucide_react16.PlusCircle, { className: "mr-2 h-4 w-4" }),
      title,
      selectedValues?.size > 0 && /* @__PURE__ */ (0, import_jsx_runtime35.jsxs)(import_jsx_runtime35.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(Separator4, { orientation: "vertical", className: "mx-2 h-4" }),
        /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(
          Badge,
          {
            variant: "secondary",
            className: "rounded-sm px-1 font-normal lg:hidden",
            children: selectedValues.size
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("div", { className: "hidden space-x-1 lg:flex", children: selectedValues.size > 2 ? /* @__PURE__ */ (0, import_jsx_runtime35.jsxs)(
          Badge,
          {
            variant: "secondary",
            className: "rounded-sm px-1 font-normal",
            children: [
              selectedValues.size,
              " selecionados"
            ]
          }
        ) : options.filter((option) => selectedValues.has(option.value)).map((option) => /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(
          Badge,
          {
            variant: "secondary",
            className: "rounded-sm px-1 font-normal",
            children: option.label
          },
          option.value
        )) })
      ] })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(PopoverContent, { className: "w-[200px] p-0", align: "start", children: /* @__PURE__ */ (0, import_jsx_runtime35.jsxs)(Command, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(CommandInput, { placeholder: title }),
      /* @__PURE__ */ (0, import_jsx_runtime35.jsxs)(CommandList, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(CommandEmpty, { children: "Nenhum resultado encontrado." }),
        /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(CommandGroup, { children: options.map((option) => {
          const isSelected = selectedValues.has(option.value);
          return /* @__PURE__ */ (0, import_jsx_runtime35.jsxs)(
            CommandItem,
            {
              onSelect: () => {
                if (isSelected) {
                  selectedValues.delete(option.value);
                } else {
                  selectedValues.add(option.value);
                }
                const filterValues = Array.from(selectedValues);
                column?.setFilterValue(
                  filterValues.length ? filterValues : void 0
                );
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(
                  "div",
                  {
                    className: cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                      isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                    ),
                    children: /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(import_lucide_react16.Check, { className: cn("h-4 w-4") })
                  }
                ),
                option.icon && /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(option.icon, { className: "mr-2 h-4 w-4 text-muted-foreground" }),
                /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("span", { children: option.label }),
                facets?.get(option.value) && /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("span", { className: "ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs", children: facets.get(option.value) })
              ]
            },
            option.value
          );
        }) }),
        selectedValues.size > 0 && /* @__PURE__ */ (0, import_jsx_runtime35.jsxs)(import_jsx_runtime35.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(CommandSeparator, {}),
          /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(CommandGroup, { children: /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(
            CommandItem,
            {
              onSelect: () => column?.setFilterValue(void 0),
              className: "justify-center text-center",
              children: "Limpar filtros"
            }
          ) })
        ] })
      ] })
    ] }) })
  ] });
}

// src/components/ui/data-table-toolbar.tsx
var import_jsx_runtime36 = require("react/jsx-runtime");
function DataTableToolbar({
  table,
  searchColumnId,
  searchPlaceholder = "Buscar...",
  facetedFilterColumns = [],
  onDeleteSelected,
  deleteConfirmation,
  deleteConfirmationMessage
}) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const groupableColumns = table.getAllColumns().filter((c) => c.getCanGroup());
  const groupingState = table.getState().grouping;
  const selectedRowsCount = table.getFilteredSelectedRowModel().rows.length;
  const handleDelete = () => {
    if (onDeleteSelected) {
      onDeleteSelected(table.getFilteredSelectedRowModel().rows.map((r) => r.original));
      table.resetRowSelection();
    }
  };
  const getColumnHeader2 = (column) => {
    if (typeof column.columnDef.header === "function") {
      const headerProps = column.columnDef.header?.({ column, header: {} })?.props;
      return headerProps?.title || column.id;
    }
    return typeof column.columnDef.header === "string" ? column.columnDef.header : column.id;
  };
  return /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("div", { className: "flex items-center justify-between", "data-ai-id": "data-table-toolbar", children: [
    /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("div", { className: "flex flex-1 flex-wrap items-center gap-2", children: [
      searchColumnId && /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(
        Input,
        {
          placeholder: searchPlaceholder,
          value: table.getColumn(searchColumnId)?.getFilterValue() ?? "",
          onChange: (event) => table.getColumn(searchColumnId)?.setFilterValue(event.target.value),
          className: "h-8 w-[150px] lg:w-[250px]",
          "data-ai-id": "data-table-search-input"
        }
      ),
      facetedFilterColumns.map((col) => table.getColumn(col.id) ? /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(
        DataTableFacetedFilter,
        {
          column: table.getColumn(col.id),
          title: col.title,
          options: col.options
        },
        col.id
      ) : null),
      groupableColumns.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("div", { className: "flex items-center gap-1", children: [
        /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(import_lucide_react17.ListTree, { className: "h-4 w-4 text-muted-foreground", "aria-hidden": "true" }),
        /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)(
          Select,
          {
            value: groupingState[0] ?? "__NONE__",
            onValueChange: (value) => table.setGrouping(value === "__NONE__" ? [] : [value]),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(SelectTrigger, { className: "h-8 w-auto min-w-[150px] text-xs", "aria-label": "Agrupar por", children: /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(SelectValue, { placeholder: "Agrupar por..." }) }),
              /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)(SelectContent, { children: [
                /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(SelectItem, { value: "__NONE__", children: "Nenhum grupo" }),
                groupableColumns.map((column) => {
                  const columnHeader = getColumnHeader2(column);
                  return /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(SelectItem, { value: column.id, children: columnHeader }, column.id);
                })
              ] })
            ]
          }
        )
      ] }),
      isFiltered && /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)(
        Button,
        {
          variant: "ghost",
          onClick: () => table.resetColumnFilters(),
          className: "h-8 px-2 lg:px-3",
          children: [
            "Limpar",
            /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(import_lucide_react17.X, { className: "ml-2 h-4 w-4" })
          ]
        }
      ),
      selectedRowsCount > 0 && onDeleteSelected && /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)(AlertDialog, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(AlertDialogTrigger, { asChild: true, children: /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)(Button, { variant: "destructive", size: "sm", className: "h-8", "data-ai-id": "data-table-delete-selected-button", children: [
          /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(import_lucide_react17.Trash2, { className: "mr-2 h-4 w-4" }),
          "Excluir (",
          selectedRowsCount,
          ")"
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)(AlertDialogContent, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)(AlertDialogHeader, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(AlertDialogTitle, { children: "Confirmar Exclus\xE3o em Massa?" }),
            /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)(AlertDialogDescription, { children: [
              "Esta a\xE7\xE3o \xE9 permanente e n\xE3o pode ser desfeita. Voc\xEA tem certeza que deseja excluir os ",
              selectedRowsCount,
              " itens selecionados? Itens que possuem v\xEDnculos (ex: leil\xF5es com lotes) ou s\xE3o protegidos n\xE3o ser\xE3o exclu\xEDdos."
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)(AlertDialogFooter, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(AlertDialogCancel, { children: "Cancelar" }),
            /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(AlertDialogAction, { onClick: handleDelete, className: "bg-destructive hover:bg-destructive/90", children: "Confirmar Exclus\xE3o" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(DataTableViewOptions, { table })
  ] });
}

// src/components/ui/data-table-pagination.tsx
var import_lucide_react18 = require("lucide-react");
var import_jsx_runtime37 = require("react/jsx-runtime");
function DataTablePagination({
  table
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)("div", { className: "flex items-center justify-between px-2", children: [
    /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)("div", { className: "flex-1 text-sm text-muted-foreground", children: [
      table.getFilteredSelectedRowModel().rows.length,
      " de",
      " ",
      table.getFilteredRowModel().rows.length,
      " linha(s) selecionada(s)."
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)("div", { className: "flex items-center space-x-6 lg:space-x-8", children: [
      /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)("div", { className: "flex items-center space-x-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("p", { className: "text-sm font-medium", children: "Linhas por p\xE1gina" }),
        /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)(
          Select,
          {
            value: `${table.getState().pagination.pageSize}`,
            onValueChange: (value) => {
              table.setPageSize(Number(value));
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(SelectTrigger, { className: "h-8 w-[70px]", children: /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(SelectValue, { placeholder: table.getState().pagination.pageSize }) }),
              /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(SelectContent, { side: "top", children: [10, 20, 30, 40, 50].map((pageSize) => /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(SelectItem, { value: `${pageSize}`, children: pageSize }, pageSize)) })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)("div", { className: "flex w-[100px] items-center justify-center text-sm font-medium", children: [
        "P\xE1gina ",
        table.getState().pagination.pageIndex + 1,
        " de",
        " ",
        table.getPageCount()
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)("div", { className: "flex items-center space-x-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)(
          Button,
          {
            variant: "outline",
            className: "hidden h-8 w-8 p-0 lg:flex",
            onClick: () => table.setPageIndex(0),
            disabled: !table.getCanPreviousPage(),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("span", { className: "sr-only", children: "Ir para a primeira p\xE1gina" }),
              /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(import_lucide_react18.ChevronsLeft, { className: "h-4 w-4" })
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)(
          Button,
          {
            variant: "outline",
            className: "h-8 w-8 p-0",
            onClick: () => table.previousPage(),
            disabled: !table.getCanPreviousPage(),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("span", { className: "sr-only", children: "Ir para a p\xE1gina anterior" }),
              /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(import_lucide_react18.ChevronLeftIcon, { className: "h-4 w-4" })
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)(
          Button,
          {
            variant: "outline",
            className: "h-8 w-8 p-0",
            onClick: () => table.nextPage(),
            disabled: !table.getCanNextPage(),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("span", { className: "sr-only", children: "Ir para a pr\xF3xima p\xE1gina" }),
              /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(import_lucide_react18.ChevronRightIcon, { className: "h-4 w-4" })
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)(
          Button,
          {
            variant: "outline",
            className: "hidden h-8 w-8 p-0 lg:flex",
            onClick: () => table.setPageIndex(table.getPageCount() - 1),
            disabled: !table.getCanNextPage(),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("span", { className: "sr-only", children: "Ir para a \xFAltima p\xE1gina" }),
              /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(import_lucide_react18.ChevronsRight, { className: "h-4 w-4" })
            ]
          }
        )
      ] })
    ] })
  ] });
}

// src/components/ui/data-table.tsx
var import_jsx_runtime38 = require("react/jsx-runtime");
function DataTable({
  columns,
  data,
  isLoading,
  error,
  searchColumnId,
  searchPlaceholder,
  facetedFilterColumns = [],
  rowSelection: controlledRowSelection,
  setRowSelection: setControlledRowSelection,
  onDeleteSelected,
  tableInstance,
  renderChildrenAboveTable
}) {
  const [uncontrolledRowSelection, setUncontrolledRowSelection] = React31.useState({});
  const [columnVisibility, setColumnVisibility] = React31.useState({});
  const [columnFilters, setColumnFilters] = React31.useState([]);
  const [sorting, setSorting] = React31.useState([]);
  const [grouping, setGrouping] = React31.useState([]);
  const isControlled = controlledRowSelection !== void 0 && setControlledRowSelection !== void 0;
  const rowSelection = isControlled ? controlledRowSelection : uncontrolledRowSelection;
  const setRowSelection = isControlled ? setControlledRowSelection : setUncontrolledRowSelection;
  const table = (0, import_react_table.useReactTable)({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      grouping
    },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGroupingChange: setGrouping,
    getCoreRowModel: (0, import_react_table.getCoreRowModel)(),
    getFilteredRowModel: (0, import_react_table.getFilteredRowModel)(),
    getPaginationRowModel: (0, import_react_table.getPaginationRowModel)(),
    getSortedRowModel: (0, import_react_table.getSortedRowModel)(),
    getGroupedRowModel: (0, import_react_table.getGroupedRowModel)(),
    getFacetedRowModel: (0, import_react_table.getFacetedRowModel)(),
    getFacetedUniqueValues: (0, import_react_table.getFacetedUniqueValues)(),
    enableRowSelection: true
  });
  return /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("div", { className: "space-y-4", "data-ai-id": "data-table-container", children: [
    /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(
      DataTableToolbar,
      {
        table,
        searchColumnId,
        searchPlaceholder,
        facetedFilterColumns,
        onDeleteSelected
      }
    ),
    renderChildrenAboveTable && renderChildrenAboveTable(table),
    /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("div", { className: "rounded-md border", children: /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)(Table, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(TableHeader, { children: table.getHeaderGroups().map((headerGroup) => /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(TableRow, { children: headerGroup.headers.map((header) => {
        return /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(TableHead, { colSpan: header.colSpan, children: header.isPlaceholder ? null : (0, import_react_table.flexRender)(
          header.column.columnDef.header,
          header.getContext()
        ) }, header.id);
      }) }, headerGroup.id)) }),
      /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(TableBody, { children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(TableCell, { colSpan: columns.length, className: "h-24 text-center", children: /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("div", { className: "flex items-center justify-center", children: [
        /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(import_lucide_react19.Loader2, { className: "mr-2 h-6 w-6 animate-spin" }),
        "Carregando dados..."
      ] }) }) }) : error ? /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(TableCell, { colSpan: columns.length, className: "h-24 text-center text-destructive", children: /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("div", { className: "flex items-center justify-center", children: [
        /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(import_lucide_react19.AlertCircle, { className: "mr-2 h-6 w-6" }),
        error
      ] }) }) }) : table.getRowModel().rows?.length ? table.getRowModel().rows.map((row) => {
        if (row.getIsGrouped()) {
          return /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(TableRow, { className: "bg-muted/50 hover:bg-muted/60 font-medium", children: /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(TableCell, { colSpan: columns.length, children: /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(
              Button,
              {
                variant: "ghost",
                size: "icon",
                className: "h-6 w-6",
                onClick: row.getToggleExpandedHandler(),
                children: row.getIsExpanded() ? /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(import_lucide_react19.ChevronDown, { className: "h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(import_lucide_react19.ChevronRight, { className: "h-4 w-4" })
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("span", { children: [
              row.getVisibleCells()[0].column.id,
              ": ",
              row.getVisibleCells()[0].getValue()
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("span", { className: "text-xs font-normal text-muted-foreground", children: [
              "(",
              row.subRows.length,
              ")"
            ] })
          ] }) }) }, row.id);
        }
        return /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(
          TableRow,
          {
            "data-state": row.getIsSelected() && "selected",
            children: row.getVisibleCells().map((cell) => /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(TableCell, { children: (0, import_react_table.flexRender)(
              cell.column.columnDef.cell,
              cell.getContext()
            ) }, cell.id))
          },
          row.id
        );
      }) : /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(
        TableCell,
        {
          colSpan: columns.length,
          className: "h-24 text-center",
          children: "Nenhum resultado encontrado."
        }
      ) }) })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(DataTablePagination, { table })
  ] });
}

// src/components/ui/data-table-column-header.tsx
var import_lucide_react20 = require("lucide-react");
var import_jsx_runtime39 = require("react/jsx-runtime");
function DataTableColumnHeader({
  column,
  title,
  className
}) {
  if (!column.getCanSort() && !column.getCanHide()) {
    return /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("div", { className: cn(className), children: title });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("div", { className: cn("flex items-center space-x-2", className), children: /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)(DropdownMenu, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)(
      Button,
      {
        variant: "ghost",
        size: "sm",
        className: "-ml-3 h-8 data-[state=open]:bg-accent",
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("span", { children: title }),
          column.getIsSorted() === "desc" ? /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(import_lucide_react20.ArrowDownIcon, { className: "ml-2 h-4 w-4" }) : column.getIsSorted() === "asc" ? /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(import_lucide_react20.ArrowUpIcon, { className: "ml-2 h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(import_lucide_react20.ChevronsUpDownIcon, { className: "ml-2 h-4 w-4" })
        ]
      }
    ) }),
    /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)(DropdownMenuContent, { align: "start", children: [
      column.getCanSort() && /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)(import_jsx_runtime39.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)(DropdownMenuItem, { onClick: () => column.toggleSorting(false), children: [
          /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(import_lucide_react20.ArrowUpIcon, { className: "mr-2 h-3.5 w-3.5 text-muted-foreground/70" }),
          "Asc"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)(DropdownMenuItem, { onClick: () => column.toggleSorting(true), children: [
          /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(import_lucide_react20.ArrowDownIcon, { className: "mr-2 h-3.5 w-3.5 text-muted-foreground/70" }),
          "Desc"
        ] })
      ] }),
      column.getCanSort() && column.getCanHide() && /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(DropdownMenuSeparator, {}),
      column.getCanHide() && /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)(DropdownMenuItem, { onClick: () => column.toggleVisibility(false), children: [
        /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(import_lucide_react20.EyeOff, { className: "mr-2 h-3.5 w-3.5 text-muted-foreground/70" }),
        "Ocultar"
      ] })
    ] })
  ] }) });
}

// src/components/ui/entity-selector.tsx
var React32 = __toESM(require("react"));
var import_lucide_react21 = require("lucide-react");
var import_link = __toESM(require("next/link"));
var import_jsx_runtime40 = require("react/jsx-runtime");
var createEntitySelectorColumns = (onSelect) => [
  {
    accessorKey: "label",
    header: "Nome",
    cell: ({ row }) => /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("div", { className: "font-medium", children: row.getValue("label") })
  },
  {
    id: "actions",
    cell: ({ row }) => /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("div", { className: "text-right", children: /* @__PURE__ */ (0, import_jsx_runtime40.jsx)(Button, { variant: "ghost", size: "sm", onClick: (e) => {
      e.stopPropagation();
      onSelect(row.original.value);
    }, children: "Selecionar" }) })
  }
];

// src/components/ui/breadcrumbs.tsx
var import_link2 = __toESM(require("next/link"));
var import_lucide_react22 = require("lucide-react");
var import_jsx_runtime41 = require("react/jsx-runtime");

// src/components/auction-card.tsx
var React35 = __toESM(require("react"));
var import_link5 = __toESM(require("next/link"));
var import_image2 = __toESM(require("next/image"));
var import_lucide_react26 = require("lucide-react");
var import_date_fns3 = require("date-fns");

// src/components/entity-edit-menu.tsx
var import_react2 = require("react");
var import_navigation = require("next/navigation");
var import_lucide_react23 = require("lucide-react");
var import_link3 = __toESM(require("next/link"));

// src/components/update-title-modal.tsx
var import_react = require("react");
var import_jsx_runtime42 = require("react/jsx-runtime");
function UpdateTitleModal({
  isOpen,
  onClose,
  onSubmit,
  currentTitle,
  entityTypeLabel
}) {
  const [newTitle, setNewTitle] = (0, import_react.useState)(currentTitle);
  const handleSubmit = async () => {
    await onSubmit(newTitle);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime42.jsx)(Dialog, { open: isOpen, onOpenChange: onClose, children: /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)(DialogContent, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)(DialogHeader, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)(DialogTitle, { children: [
        "Alterar T\xEDtulo d",
        entityTypeLabel
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)(DialogDescription, { children: [
        "Insira o novo t\xEDtulo para ",
        entityTypeLabel.toLowerCase(),
        "."
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("div", { className: "grid gap-4 py-4", children: /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)("div", { className: "grid grid-cols-4 items-center gap-4", children: [
      /* @__PURE__ */ (0, import_jsx_runtime42.jsx)(Label2, { htmlFor: "newTitle", className: "text-right", children: "Novo T\xEDtulo" }),
      /* @__PURE__ */ (0, import_jsx_runtime42.jsx)(
        Input,
        {
          id: "newTitle",
          value: newTitle,
          onChange: (e) => setNewTitle(e.target.value),
          className: "col-span-3"
        }
      )
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)(DialogFooter, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime42.jsx)(Button, { variant: "outline", onClick: onClose, children: "Cancelar" }),
      /* @__PURE__ */ (0, import_jsx_runtime42.jsx)(Button, { onClick: handleSubmit, children: "Salvar Altera\xE7\xF5es" })
    ] })
  ] }) });
}

// src/components/entity-edit-menu.tsx
var import_jsx_runtime43 = require("react/jsx-runtime");
function EntityEditMenu({
  entityType,
  entityId,
  publicId,
  currentTitle,
  isFeatured,
  onUpdate
}) {
  const router = (0, import_navigation.useRouter)();
  const [isTitleModalOpen, setIsTitleModalOpen] = (0, import_react2.useState)(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = (0, import_react2.useState)(false);
  const hasEditPermission = true;
  if (!hasEditPermission) {
    return null;
  }
  const handleToggleFeatured = async () => {
    console.log("Toggle featured clicked");
  };
  const handleTitleUpdate = async (newTitle) => {
    console.log("Title update clicked");
    setIsTitleModalOpen(false);
  };
  const handleImageUpdate = async (selectedItems) => {
    console.log("Image update clicked");
  };
  const adminEditUrl = `/admin/${entityType}s/${entityId}/edit`;
  return /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)(import_jsx_runtime43.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)(DropdownMenu, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)(Tooltip, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(Button, { variant: "outline", size: "icon", className: "h-7 w-7 bg-background/80 hover:bg-primary/10", "aria-label": "Editar Entidade", children: /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(import_lucide_react23.Pencil, { className: "h-3.5 w-3.5 text-primary" }) }) }) }),
        /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(TooltipContent, { children: /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("p", { children: "Op\xE7\xF5es de Edi\xE7\xE3o" }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)(DropdownMenuContent, { align: "end", className: "w-56", children: [
        /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(DropdownMenuLabel, { children: "Edi\xE7\xE3o R\xE1pida" }),
        /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(DropdownMenuSeparator, {}),
        /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)(DropdownMenuItem, { onClick: () => setIsMediaModalOpen(true), children: [
          /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(import_lucide_react23.Image, { className: "mr-2 h-4 w-4" }),
          /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("span", { children: "Editar Imagem Principal" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)(DropdownMenuItem, { onClick: () => setIsTitleModalOpen(true), children: [
          /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(import_lucide_react23.TextCursorInput, { className: "mr-2 h-4 w-4" }),
          /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("span", { children: "Alterar T\xEDtulo" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)(DropdownMenuItem, { onClick: handleToggleFeatured, children: [
          /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(import_lucide_react23.Star, { className: "mr-2 h-4 w-4" }),
          /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("span", { children: isFeatured ? "Remover Destaque" : "Destacar no Marketplace" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(DropdownMenuSeparator, {}),
        /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(DropdownMenuItem, { asChild: true, children: /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)(import_link3.default, { href: adminEditUrl, children: [
          /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(import_lucide_react23.ExternalLink, { className: "mr-2 h-4 w-4" }),
          /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("span", { children: "Edi\xE7\xE3o Completa" })
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(
      UpdateTitleModal,
      {
        isOpen: isTitleModalOpen,
        onClose: () => setIsTitleModalOpen(false),
        onSubmit: handleTitleUpdate,
        currentTitle,
        entityTypeLabel: entityType === "lot" ? "Lote" : "Leil\xE3o"
      }
    )
  ] });
}

// src/components/auction/auction-stages-timeline.tsx
var import_lucide_react24 = require("lucide-react");
var import_date_fns2 = require("date-fns");
var import_locale = require("date-fns/locale");
var import_react3 = require("react");
var import_jsx_runtime44 = require("react/jsx-runtime");
var AuctionStageItem = ({ stage, isCompleted, isActive }) => {
  const [formattedDate, setFormattedDate] = (0, import_react3.useState)("N/D");
  const [formattedTime, setFormattedTime] = (0, import_react3.useState)("");
  (0, import_react3.useEffect)(() => {
    if (stage.endDate) {
      const dateObj = stage.endDate instanceof Date ? stage.endDate : new Date(stage.endDate);
      if (!isNaN(dateObj.getTime())) {
        setFormattedDate((0, import_date_fns2.format)(dateObj, "dd/MM", { locale: import_locale.ptBR }));
        setFormattedTime((0, import_date_fns2.format)(dateObj, "HH:mm", { locale: import_locale.ptBR }));
      }
    }
  }, [stage.endDate]);
  return /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { className: "flex items-start gap-2 flex-1 min-w-0 px-1 text-xs", children: [
    /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { className: "flex flex-col items-center gap-1 mt-1", children: /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { className: cn(
      "h-3.5 w-3.5 rounded-full border-2",
      isCompleted ? "bg-primary border-primary" : isActive ? "bg-background border-primary ring-2 ring-primary/30" : "bg-background border-border"
    ) }) }),
    /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { className: "flex-grow", children: [
      /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("p", { className: cn(
        "font-semibold truncate w-full",
        isActive ? "text-primary" : isCompleted ? "text-muted-foreground line-through" : "text-foreground"
      ), title: stage.name || "", children: stage.name || `Etapa` }),
      /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("p", { className: "text-muted-foreground", children: [
        formattedDate,
        " - ",
        formattedTime
      ] }),
      stage.evaluationValue && /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("p", { className: "text-primary font-medium", children: [
        "R$ ",
        stage.evaluationValue.toLocaleString("pt-br")
      ] })
    ] })
  ] });
};
function AuctionStagesTimeline({ stages }) {
  if (!stages || stages.length === 0) {
    return null;
  }
  const processedStages = stages.map((stage) => ({
    ...stage,
    startDate: stage.startDate ? new Date(stage.startDate) : null,
    endDate: stage.endDate ? new Date(stage.endDate) : null
  })).sort((a, b) => (a.startDate?.getTime() || 0) - (b.startDate?.getTime() || 0));
  const now = /* @__PURE__ */ new Date();
  let activeStageIndex = processedStages.findIndex(
    (stage) => stage.startDate && stage.endDate && now >= stage.startDate && now < stage.endDate
  );
  if (activeStageIndex === -1) {
    const nextStageIndex = processedStages.findIndex((stage) => stage.startDate && now < stage.startDate);
    if (nextStageIndex !== -1) {
      activeStageIndex = nextStageIndex;
    } else if (processedStages.every((s) => s.endDate && (0, import_date_fns2.isPast)(s.endDate))) {
      activeStageIndex = processedStages.length;
    }
  }
  return /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("h4", { className: "text-xs font-semibold mb-2 flex items-center text-muted-foreground", children: [
      /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(import_lucide_react24.CalendarDays, { className: "h-3 w-3 mr-1.5" }),
      "ETAPAS DO LEIL\xC3O"
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("div", { className: "relative flex flex-col space-y-2", children: [
      /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("div", { className: "absolute left-[6px] top-2 bottom-2 w-0.5 bg-border -z-10" }),
      processedStages.map((stage, index) => {
        const isCompleted = stage.endDate ? (0, import_date_fns2.isPast)(stage.endDate) : false;
        const isActive = index === activeStageIndex;
        return /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(AuctionStageItem, { stage, isActive, isCompleted }, stage.name || index);
      })
    ] })
  ] });
}

// src/components/auction/auction-preview-modal.tsx
var import_image = __toESM(require("next/image"));
var import_lucide_react25 = require("lucide-react");
var import_link4 = __toESM(require("next/link"));
var import_react4 = require("react");
var import_jsx_runtime45 = require("react/jsx-runtime");
function AuctionPreviewModal({ auction, isOpen, onClose }) {
  if (!isOpen) return null;
  const getAuctioneerInitial = () => {
    const name = auction.auctioneerName || auction.auctioneer?.name;
    if (name && typeof name === "string") {
      return name.charAt(0).toUpperCase();
    }
    return "L";
  };
  const auctioneerInitial = getAuctioneerInitial();
  const displayLocation = auction.address || "Nacional";
  const validImageUrl = auction.imageUrl ?? "https://placehold.co/600x400.png";
  const auctionDates = (0, import_react4.useMemo)(() => {
    const dates = [];
    if (auction.auctionDate) dates.push(new Date(auction.auctionDate));
    if (auction.endDate) dates.push(new Date(auction.endDate));
    (auction.auctionStages || []).forEach((stage) => {
      if (stage.endDate) dates.push(new Date(stage.endDate));
    });
    const uniqueDates = Array.from(new Set(dates.map((d) => d.toISOString()))).map((iso) => new Date(iso));
    return uniqueDates;
  }, [auction]);
  return /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(Dialog, { open: isOpen, onOpenChange: onClose, children: /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)(DialogContent, { className: "sm:max-w-[800px] max-h-[90vh] flex flex-col p-0", children: [
    /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)(DialogHeader, { className: "p-4 sm:p-6 pb-0 flex-shrink-0", children: [
      /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(DialogTitle, { className: "text-xl sm:text-2xl font-bold font-headline", children: auction.title }),
      /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)(DialogDescription, { children: [
        "Leil\xE3o do tipo ",
        auction.auctionType || "N\xE3o especificado",
        " em ",
        displayLocation
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)("div", { className: "flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto px-4 sm:px-6", children: [
      /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)("div", { className: "space-y-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("div", { className: "relative aspect-video w-full bg-muted rounded-md overflow-hidden", children: /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(
          import_image.default,
          {
            src: validImageUrl,
            alt: auction.title,
            fill: true,
            className: "object-cover",
            "data-ai-hint": auction.dataAiHint || "auction item image"
          }
        ) }),
        /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)(Card, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(CardHeader, { className: "p-3", children: /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)(CardTitle, { className: "text-md font-semibold flex items-center", children: [
            /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(import_lucide_react25.Landmark, { className: "mr-2 h-4 w-4" }),
            " Leiloeiro e Comitente"
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)(CardContent, { className: "p-3 pt-0 text-sm space-y-2", children: [
            /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)(Avatar, { className: "h-9 w-9 border", children: [
                /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(AvatarImage, { src: auction.auctioneer?.logoUrl || "", alt: auction.auctioneerName || "", "data-ai-hint": auction.auctioneer?.dataAiHintLogo || "leiloeiro logo" }),
                /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(AvatarFallback, { children: auctioneerInitial })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("p", { className: "text-xs text-muted-foreground", children: "Leiloeiro" }),
                /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("p", { className: "font-semibold", children: auction.auctioneer?.name || auction.auctioneerName })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("div", { className: "border-t border-dashed my-1" }),
            /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("p", { className: "text-xs text-muted-foreground", children: "Comitente/Vendedor" }),
              /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("p", { className: "font-semibold", children: auction.seller?.name || "N\xE3o informado" })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)("div", { className: "space-y-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)(Card, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(CardHeader, { className: "p-3", children: /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)(CardTitle, { className: "text-md font-semibold flex items-center", children: [
            /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(import_lucide_react25.ListChecks, { className: "mr-2 h-4 w-4" }),
            "Lotes e Visitas"
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)(CardContent, { className: "p-3 pt-0 grid grid-cols-2 gap-2 text-center", children: [
            /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)("div", { className: "bg-accent/40 p-2 rounded-md", children: [
              /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("p", { className: "text-xl font-bold", children: auction.totalLots || 0 }),
              /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("p", { className: "text-xs text-muted-foreground", children: "Lotes" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)("div", { className: "bg-accent/40 p-2 rounded-md", children: [
              /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("p", { className: "text-xl font-bold", children: auction.visits || 0 }),
              /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("p", { className: "text-xs text-muted-foreground", children: "Visitas" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(AuctionStagesTimeline, { stages: auction.auctionStages || [] }),
        /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)(Card, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(CardHeader, { className: "p-3", children: /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)(CardTitle, { className: "text-md font-semibold flex items-center", children: [
            /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(import_lucide_react25.CalendarDays, { className: "mr-2 h-4 w-4" }),
            " Calend\xE1rio"
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(CardContent, { className: "flex justify-center p-0", children: /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(
            Calendar,
            {
              mode: "multiple",
              selected: auctionDates,
              defaultMonth: auction.auctionDate ? new Date(auction.auctionDate) : /* @__PURE__ */ new Date(),
              className: "p-2",
              classNames: {
                cell: "h-8 w-8 text-center text-xs p-0 relative",
                day: "h-8 w-8 p-0",
                head_cell: "w-8"
              }
            }
          ) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)(DialogFooter, { className: "p-4 sm:p-6 border-t bg-background flex justify-between w-full flex-shrink-0", children: [
      /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(Button, { variant: "outline", onClick: onClose, children: " Fechar " }),
      /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(Button, { asChild: true, children: /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)(import_link4.default, { href: `/auctions/${auction.publicId || auction.id}`, children: [
        /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(import_lucide_react25.Eye, { className: "mr-2 h-4 w-4" }),
        " Ver Leil\xE3o Completo"
      ] }) })
    ] })
  ] }) });
}

// src/components/auction-card.tsx
var import_jsx_runtime46 = require("react/jsx-runtime");
function AuctionCard({ auction, onUpdate }) {
  const [isFavorite, setIsFavorite] = React35.useState(auction.isFavorite || false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = React35.useState(false);
  const [auctionFullUrl, setAuctionFullUrl] = React35.useState(`/auctions/${auction.publicId || auction.id}`);
  const soldLotsCount = React35.useMemo(() => {
    if (!auction.lots || auction.lots.length === 0) return 0;
    return auction.lots.filter((lot) => lot.status === "VENDIDO").length;
  }, [auction.lots]);
  const mentalTriggers = React35.useMemo(() => {
    const triggers = [];
    const now = /* @__PURE__ */ new Date();
    if (auction.endDate) {
      const endDate = new Date(auction.endDate);
      if (!(0, import_date_fns3.isPast)(endDate)) {
        const daysDiff = (0, import_date_fns3.differenceInDays)(endDate, now);
        if (daysDiff === 0) triggers.push("ENCERRA HOJE");
        else if (daysDiff === 1) triggers.push("ENCERRA AMANH\xC3");
      }
    }
    if ((auction.totalHabilitatedUsers || 0) > 100) {
      triggers.push("ALTA DEMANDA");
    }
    if (auction.isFeaturedOnMarketplace) {
      triggers.push("DESTAQUE");
    }
    if (auction.additionalTriggers) {
      triggers.push(...auction.additionalTriggers);
    }
    return Array.from(new Set(triggers));
  }, [auction.endDate, auction.totalHabilitatedUsers, auction.isFeaturedOnMarketplace, auction.additionalTriggers]);
  React35.useEffect(() => {
    if (typeof window !== "undefined") {
      setAuctionFullUrl(`${window.location.origin}/auctions/${auction.publicId || auction.id}`);
    }
  }, [auction.id, auction.publicId]);
  const handleFavoriteToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };
  const openPreviewModal = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPreviewModalOpen(true);
  };
  const getSocialLink = (platform, url, title) => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    switch (platform) {
      case "x":
        return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
      case "facebook":
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      case "whatsapp":
        return `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`;
      case "email":
        return `mailto:?subject=${encodedTitle}&body=${encodedUrl}`;
    }
  };
  const mainImageUrl = isValidImageUrl(auction.imageUrl) ? auction.imageUrl : "https://placehold.co/600x400.png";
  const mainImageAlt = auction.title || "Imagem do Leil\xE3o";
  const mainImageDataAiHint = auction.dataAiHint || "auction image";
  const sellerLogoUrl = isValidImageUrl(auction.seller?.logoUrl) ? auction.seller?.logoUrl : void 0;
  const sellerSlug = auction.seller?.slug;
  const sellerName = auction.seller?.name;
  const getAuctionTypeDisplay = (type) => {
    if (!type) return null;
    switch (type) {
      case "JUDICIAL":
        return { label: "Judicial", icon: /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(import_lucide_react26.Gavel, { className: "h-3 w-3" }) };
      case "EXTRAJUDICIAL":
        return { label: "Extrajudicial", icon: /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(import_lucide_react26.Gavel, { className: "h-3 w-3" }) };
      case "PARTICULAR":
        return { label: "Particular", icon: /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(import_lucide_react26.Gavel, { className: "h-3 w-3" }) };
      case "TOMADA_DE_PRECOS":
        return { label: "Tomada de Pre\xE7os", icon: /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(import_lucide_react26.FileText, { className: "h-3 w-3" }) };
      default:
        return null;
    }
  };
  const auctionTypeDisplay = getAuctionTypeDisplay(auction.auctionType);
  const getStatusDisplay = () => {
    if (auction.status === "ENCERRADO" || auction.status === "FINALIZADO") {
      if (soldLotsCount > 0) {
        return { text: `Vendido (${soldLotsCount}/${auction.totalLots})`, className: "bg-green-600 text-white" };
      }
      return { text: "Finalizado (Sem Venda)", className: "bg-gray-500 text-white" };
    }
    if (auction.status === "ABERTO_PARA_LANCES" || auction.status === "ABERTO") {
      return { text: getAuctionStatusText(auction.status), className: "bg-green-600 text-white" };
    }
    if (auction.status === "EM_BREVE") {
      return { text: getAuctionStatusText(auction.status), className: "bg-blue-500 text-white" };
    }
    return { text: getAuctionStatusText(auction.status), className: "bg-gray-500 text-white" };
  };
  const statusDisplay = getStatusDisplay();
  return /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(TooltipProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)(import_jsx_runtime46.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)(Card, { "data-ai-id": `auction-card-container-${auction.id}`, className: "flex flex-col overflow-hidden h-full shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg group", children: [
      /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("div", { className: "relative", children: [
        /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(import_link5.default, { href: `/auctions/${auction.publicId || auction.id}`, className: "block", children: /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("div", { className: "aspect-[16/10] relative bg-muted", children: [
          /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(
            import_image2.default,
            {
              src: mainImageUrl,
              alt: mainImageAlt,
              fill: true,
              sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
              className: "object-cover",
              "data-ai-hint": mainImageDataAiHint,
              "data-ai-id": `auction-card-main-image-${auction.id}`
            }
          ),
          sellerLogoUrl && /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)(Tooltip, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(import_link5.default, { href: sellerSlug ? `/sellers/${sellerSlug}` : "#", onClick: (e) => e.stopPropagation(), className: "absolute bottom-2 right-2 z-10", children: /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)(Avatar, { className: "h-12 w-12 border-2 bg-background border-border shadow-md", "data-ai-id": `auction-card-seller-logo-${auction.id}`, children: [
              /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(AvatarImage, { src: sellerLogoUrl, alt: sellerName || "Logo Comitente", "data-ai-hint": auction.seller?.dataAiHintLogo || "logo comitente" }),
              /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(AvatarFallback, { children: sellerName ? sellerName.charAt(0) : "C" })
            ] }) }) }),
            /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(TooltipContent, { children: /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("p", { children: [
              "Comitente: ",
              sellerName
            ] }) })
          ] })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime46.jsx)("div", { className: "absolute top-2 left-2 flex flex-col items-start gap-1 z-10", "data-ai-id": `auction-card-badges-${auction.id}`, children: /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(Badge, { className: `text-xs px-2 py-1 ${statusDisplay.className}`, children: statusDisplay.text }) }),
        /* @__PURE__ */ (0, import_jsx_runtime46.jsx)("div", { className: "absolute top-2 right-2 flex flex-col items-end gap-1 z-10", "data-ai-id": `auction-card-mental-triggers-${auction.id}`, children: mentalTriggers.map((trigger) => /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)(Badge, { variant: "secondary", className: "text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 border-amber-300", children: [
          trigger.startsWith("ENCERRA") && /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(import_lucide_react26.Clock, { className: "h-3 w-3 mr-0.5" }),
          trigger === "ALTA DEMANDA" && /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(import_lucide_react26.Users, { className: "h-3 w-3 mr-0.5" }),
          trigger === "DESTAQUE" && /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(import_lucide_react26.Star, { className: "h-3 w-3 mr-0.5" }),
          trigger
        ] }, trigger)) }),
        /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("div", { className: "absolute bottom-2 left-1/2 z-20 flex w-full -translate-x-1/2 transform-gpu flex-row items-center justify-center space-x-1.5 opacity-0 transition-all duration-300 group-hover:-translate-y-0 group-hover:opacity-100 translate-y-4", children: [
          /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)(Tooltip, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(Button, { variant: "outline", size: "icon", className: "h-8 w-8 bg-background/80 hover:bg-background", onClick: handleFavoriteToggle, "aria-label": isFavorite ? "Desfavoritar" : "Favoritar", children: /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(import_lucide_react26.Heart, { className: `h-4 w-4 ${isFavorite ? "text-red-500 fill-red-500" : "text-muted-foreground"}` }) }) }),
            /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(TooltipContent, { children: /* @__PURE__ */ (0, import_jsx_runtime46.jsx)("p", { children: isFavorite ? "Desfavoritar" : "Favoritar" }) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)(Tooltip, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(Button, { variant: "outline", size: "icon", className: "h-8 w-8 bg-background/80 hover:bg-background", onClick: openPreviewModal, "aria-label": "Pr\xE9-visualizar", children: /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(import_lucide_react26.Eye, { className: "h-4 w-4 text-muted-foreground" }) }) }),
            /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(TooltipContent, { children: /* @__PURE__ */ (0, import_jsx_runtime46.jsx)("p", { children: "Pr\xE9-visualizar" }) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)(DropdownMenu, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)(Tooltip, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(Button, { variant: "outline", size: "icon", className: "h-8 w-8 bg-background/80 hover:bg-background", "aria-label": "Compartilhar", children: /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(import_lucide_react26.Share2, { className: "h-4 w-4 text-muted-foreground" }) }) }) }),
              /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(TooltipContent, { children: /* @__PURE__ */ (0, import_jsx_runtime46.jsx)("p", { children: "Compartilhar" }) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)(DropdownMenuContent, { align: "end", className: "w-56", children: [
              /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(DropdownMenuItem, { asChild: true, children: /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("a", { href: getSocialLink("x", auctionFullUrl, auction.title), target: "_blank", rel: "noopener noreferrer", className: "flex items-center gap-2 text-xs", children: [
                /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(import_lucide_react26.X, { className: "h-3.5 w-3.5" }),
                " X (Twitter)"
              ] }) }),
              /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(DropdownMenuItem, { asChild: true, children: /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("a", { href: getSocialLink("facebook", auctionFullUrl, auction.title), target: "_blank", rel: "noopener noreferrer", className: "flex items-center gap-2 text-xs", children: [
                /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(import_lucide_react26.Facebook, { className: "h-3.5 w-3.5" }),
                " Facebook"
              ] }) }),
              /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(DropdownMenuItem, { asChild: true, children: /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("a", { href: getSocialLink("whatsapp", auctionFullUrl, auction.title), target: "_blank", rel: "noopener noreferrer", className: "flex items-center gap-2 text-xs", children: [
                /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(import_lucide_react26.MessageSquareText, { className: "h-3.5 w-3.5" }),
                " WhatsApp"
              ] }) }),
              /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(DropdownMenuItem, { asChild: true, children: /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("a", { href: getSocialLink("email", auctionFullUrl, auction.title), className: "flex items-center gap-2 text-xs", children: [
                /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(import_lucide_react26.Mail, { className: "h-3.5 w-3.5" }),
                " Email"
              ] }) })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(
            EntityEditMenu,
            {
              entityType: "auction",
              entityId: auction.id,
              publicId: auction.publicId,
              currentTitle: auction.title,
              isFeatured: auction.isFeaturedOnMarketplace || false,
              onUpdate
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)(CardContent, { className: "p-4 flex-grow", children: [
        /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("div", { className: "flex justify-between items-start text-xs text-muted-foreground mb-1", children: [
          /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("span", { className: "truncate", title: `ID: ${auction.publicId || auction.id}`, "data-ai-id": `auction-card-public-id-${auction.id}`, children: [
            "ID: ",
            auction.publicId || auction.id
          ] }),
          auctionTypeDisplay && /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("div", { className: "flex items-center gap-1", "data-ai-id": `auction-card-type-${auction.id}`, children: [
            auctionTypeDisplay.icon,
            /* @__PURE__ */ (0, import_jsx_runtime46.jsx)("span", { children: auctionTypeDisplay.label })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(import_link5.default, { href: `/auctions/${auction.publicId || auction.id}`, children: /* @__PURE__ */ (0, import_jsx_runtime46.jsx)("h3", { "data-ai-id": `auction-card-title-${auction.id}`, className: "text-md font-semibold hover:text-primary transition-colors mb-2 leading-tight min-h-[2.5em] line-clamp-2", children: auction.title }) }),
        /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("div", { className: "grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-muted-foreground mb-2", "data-ai-id": `auction-card-counters-${auction.id}`, children: [
          /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("div", { className: "flex items-center", title: `${auction.totalLots || 0} Lotes`, children: [
            /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(import_lucide_react26.ListChecks, { className: "h-3.5 w-3.5 mr-1.5 flex-shrink-0 text-primary/80" }),
            /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("span", { className: "truncate", children: [
              auction.totalLots || 0,
              " Lotes"
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("div", { className: "flex items-center", title: `${auction.visits || 0} Visitas`, children: [
            /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(import_lucide_react26.Eye, { className: "h-3.5 w-3.5 mr-1.5 flex-shrink-0 text-primary/80" }),
            /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("span", { className: "truncate", children: [
              auction.visits || 0,
              " Visitas"
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("div", { className: "flex items-center", title: `${auction.totalHabilitatedUsers || 0} Usu\xE1rios Habilitados`, children: [
            /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(import_lucide_react26.Users, { className: "h-3.5 w-3.5 mr-1.5 flex-shrink-0 text-primary/80" }),
            /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("span", { className: "truncate", children: [
              auction.totalHabilitatedUsers || 0,
              " Habilitados"
            ] })
          ] })
        ] }),
        auction.auctionStages && auction.auctionStages.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime46.jsx)("div", { className: "space-y-1 mb-3 text-xs", "data-ai-id": `auction-card-timeline-${auction.id}`, children: /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(AuctionStagesTimeline, { stages: auction.auctionStages }) }) : null
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)(CardFooter, { className: "p-4 border-t flex-col items-start space-y-2", children: [
        auction.initialOffer && /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("div", { className: "w-full", "data-ai-id": `auction-card-initial-offer-${auction.id}`, children: [
          /* @__PURE__ */ (0, import_jsx_runtime46.jsx)("p", { className: "text-xs text-muted-foreground", children: auction.auctionType === "TOMADA_DE_PRECOS" ? "Valor de Refer\xEAncia" : "A partir de" }),
          /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("p", { className: "text-2xl font-bold text-primary", children: [
            "R$ ",
            auction.initialOffer.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(Button, { asChild: true, className: "w-full mt-2", children: /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)(import_link5.default, { href: `/auctions/${auction.publicId || auction.id}`, children: [
          "Ver Lotes (",
          auction.totalLots,
          ")"
        ] }) })
      ] })
    ] }),
    isPreviewModalOpen && /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(
      AuctionPreviewModal,
      {
        auction,
        isOpen: isPreviewModalOpen,
        onClose: () => setIsPreviewModalOpen(false)
      }
    )
  ] }) });
}

// src/components/lot-card.tsx
var React36 = __toESM(require("react"));
var import_link7 = __toESM(require("next/link"));
var import_image4 = __toESM(require("next/image"));
var import_lucide_react28 = require("lucide-react");
var import_date_fns5 = require("date-fns");

// src/components/lot-preview-modal.tsx
var import_image3 = __toESM(require("next/image"));
var import_lucide_react27 = require("lucide-react");
var import_link6 = __toESM(require("next/link"));
var import_react5 = require("react");
var import_date_fns4 = require("date-fns");
var import_locale2 = require("date-fns/locale");
var import_jsx_runtime47 = require("react/jsx-runtime");
var InfoItem = ({ icon: Icon2, value, label }) => {
  if (!value && value !== 0) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("div", { className: "flex items-center text-sm text-muted-foreground bg-secondary/30 p-2 rounded-md", children: [
    /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(Icon2, { className: "h-5 w-5 mr-2 text-primary/80" }),
    /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("span", { className: "font-semibold text-foreground mr-1", children: [
      label,
      ":"
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("span", { children: value })
  ] });
};
var TimeRemaining = ({ endDate }) => {
  const [remaining, setRemaining] = (0, import_react5.useState)("");
  (0, import_react5.useEffect)(() => {
    if (!endDate || !(0, import_date_fns4.isValid)(endDate)) {
      setRemaining("Encerrado");
      return;
    }
    const interval = setInterval(() => {
      if ((0, import_date_fns4.isPast)(endDate)) {
        setRemaining("Encerrado");
        clearInterval(interval);
        return;
      }
      const totalSeconds = (0, import_date_fns4.differenceInSeconds)(endDate, /* @__PURE__ */ new Date());
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor(totalSeconds % 86400 / 3600);
      const minutes = Math.floor(totalSeconds % 3600 / 60);
      const seconds = totalSeconds % 60;
      if (days > 0) setRemaining(`${days}d ${hours}h`);
      else setRemaining(`${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`);
    }, 1e3);
    return () => clearInterval(interval);
  }, [endDate]);
  return /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(import_jsx_runtime47.Fragment, { children: remaining || "Calculando..." });
};
function LotPreviewModal({ lot, auction, platformSettings, isOpen, onClose }) {
  if (!isOpen || !lot) return null;
  const gallery = (0, import_react5.useMemo)(() => {
    const images = [lot.imageUrl, ...lot.galleryImageUrls || []].filter(Boolean);
    if (images.length === 0) {
      images.push("https://placehold.co/800x600.png?text=Imagem+Indispon%C3%ADvel");
    }
    return images;
  }, [lot.imageUrl, lot.galleryImageUrls]);
  const [currentImageIndex, setCurrentImageIndex] = (0, import_react5.useState)(0);
  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % gallery.length);
  };
  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + gallery.length) % gallery.length);
  };
  const lotDetailUrl = `/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`;
  const mentalTriggersGlobalSettings = platformSettings?.mentalTriggerSettings || { showDiscountBadge: false, showUrgencyTimer: false, urgencyTimerThresholdDays: 0, urgencyTimerThresholdHours: 0, showPopularityBadge: false, popularityViewThreshold: 0, showHotBidBadge: false, hotBidThreshold: 0, showExclusiveBadge: false };
  const discountPercentage = (0, import_react5.useMemo)(() => {
    if (lot.initialPrice && lot.secondInitialPrice && lot.secondInitialPrice < lot.initialPrice && (lot.status === "ABERTO_PARA_LANCES" || lot.status === "EM_BREVE")) {
      return Math.round((lot.initialPrice - lot.secondInitialPrice) / lot.initialPrice * 100);
    }
    return lot.discountPercentage || 0;
  }, [lot.initialPrice, lot.secondInitialPrice, lot.status, lot.discountPercentage]);
  const mentalTriggers = (0, import_react5.useMemo)(() => {
    let triggers = lot.additionalTriggers ? [...lot.additionalTriggers] : [];
    const settings = mentalTriggersGlobalSettings;
    if (settings.showPopularityBadge && (lot.views || 0) > (settings.popularityViewThreshold || 500)) triggers.push("MAIS VISITADO");
    if (settings.showHotBidBadge && (lot.bidsCount || 0) > (settings.hotBidThreshold || 10) && lot.status === "ABERTO_PARA_LANCES") triggers.push("LANCE QUENTE");
    if (settings.showExclusiveBadge && lot.isExclusive) triggers.push("EXCLUSIVO");
    return Array.from(new Set(triggers));
  }, [lot.views, lot.bidsCount, lot.status, lot.additionalTriggers, lot.isExclusive, mentalTriggersGlobalSettings]);
  const { effectiveLotEndDate } = (0, import_react5.useMemo)(() => getEffectiveLotEndDate(lot, auction), [lot, auction]);
  const activeStage = (0, import_react5.useMemo)(() => getActiveStage(auction?.auctionStages), [auction?.auctionStages]);
  const activeLotPrices = (0, import_react5.useMemo)(() => getLotPriceForStage(lot, activeStage?.id), [lot, activeStage]);
  const keySpecs = [
    { label: "Ano", value: lot.year, icon: import_lucide_react27.CalendarDays },
    { label: "KM", value: lot.odometer, icon: import_lucide_react27.Car },
    { label: "C\xE2mbio", value: lot.transmissionType, icon: import_lucide_react27.Car },
    { label: "Quartos", value: lot.bens?.[0]?.bedrooms, icon: import_lucide_react27.Building },
    { label: "\xC1rea m\xB2", value: lot.bens?.[0]?.area, icon: import_lucide_react27.Building },
    { label: "Ra\xE7a", value: lot.bens?.[0]?.breed, icon: import_lucide_react27.Leaf }
  ].filter((spec) => spec.value !== void 0 && spec.value !== null);
  const formattedEndDate = effectiveLotEndDate ? (0, import_date_fns4.format)(effectiveLotEndDate, "dd/MM/yyyy '\xE0s' HH:mm", { locale: import_locale2.ptBR }) : "N\xE3o definida";
  return /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(Dialog, { open: isOpen, onOpenChange: onClose, children: /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)(DialogContent, { className: "sm:max-w-[850px] max-h-[90vh] flex flex-col p-0", children: [
    /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)(DialogHeader, { className: "p-4 sm:p-6 pb-0 flex-shrink-0", children: [
      /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(DialogTitle, { className: "text-xl sm:text-2xl font-bold font-headline line-clamp-2", children: lot.title }),
      /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)(DialogDescription, { children: [
        "Lote N\xBA: ",
        lot.number || lot.id.replace("LOTE", "")
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("div", { className: "flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto px-4 sm:px-6", children: [
      /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("div", { className: "space-y-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("div", { className: "relative aspect-video w-full bg-muted rounded-md overflow-hidden", children: [
          /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(import_image3.default, { src: gallery[currentImageIndex], alt: `Imagem ${currentImageIndex + 1} de ${lot.title}`, fill: true, className: "object-contain", "data-ai-hint": lot.dataAiHint || "imagem lote preview", priority: true }),
          gallery.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)(import_jsx_runtime47.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(Button, { variant: "outline", size: "icon", onClick: prevImage, className: "absolute left-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background h-8 w-8 rounded-full shadow-md", children: /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(import_lucide_react27.ChevronLeft, { className: "h-5 w-5" }) }),
            /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(Button, { variant: "outline", size: "icon", onClick: nextImage, className: "absolute right-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background h-8 w-8 rounded-full shadow-md", children: /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(import_lucide_react27.ChevronRight, { className: "h-5 w-5" }) })
          ] })
        ] }),
        gallery.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("div", { className: "grid grid-cols-5 gap-1.5", children: gallery.slice(0, 5).map((imgUrl, index) => /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("button", { onClick: () => setCurrentImageIndex(index), className: `relative aspect-square bg-muted rounded-sm overflow-hidden border-2 flex-shrink-0 ${index === currentImageIndex ? "border-primary" : "border-transparent"}`, children: /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(import_image3.default, { src: imgUrl, alt: `Thumbnail ${index + 1}`, fill: true, className: "object-cover" }) }, index)) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("div", { className: "space-y-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("div", { className: "p-3 border rounded-lg bg-amber-50 dark:bg-amber-900/20 border-amber-500/30", children: [
          /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("div", { className: "flex items-center gap-2 text-amber-700 dark:text-amber-300", children: [
            /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(import_lucide_react27.TrendingUp, { className: "h-5 w-5" }),
            /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("p", { className: "font-bold", children: "Alta Demanda!" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("p", { className: "text-xs text-amber-600 dark:text-amber-400 mt-1", children: [
            lot.views || 0,
            " pessoas viram este lote. ",
            lot.bidsCount || 0,
            " lances j\xE1 foram feitos."
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("div", { className: "space-y-2", children: [
          /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("p", { className: "text-sm text-muted-foreground", children: "Lance Atual" }),
          /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("p", { className: "text-4xl font-bold text-primary", children: [
            "R$ ",
            lot.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("p", { className: "text-sm text-muted-foreground", children: [
            "Pr\xF3ximo lance m\xEDnimo: R$ ",
            (lot.price + (lot.bidIncrementStep || 100)).toLocaleString("pt-BR")
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(Separator4, {}),
        /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("div", { className: "space-y-2", children: [
          /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("div", { className: "flex items-center text-destructive font-semibold", children: [
            /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(import_lucide_react27.Clock, { className: "h-5 w-5 mr-2" }),
            /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("span", { className: "text-lg", children: [
              "Encerra em: ",
              /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(TimeRemaining, { endDate: effectiveLotEndDate })
            ] })
          ] }),
          discountPercentage > 0 && /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("div", { className: "flex items-center text-green-600 font-semibold", children: [
            /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(import_lucide_react27.Percent, { className: "h-5 w-5 mr-2" }),
            /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("span", { className: "text-lg", children: [
              discountPercentage,
              "% de Desconto sobre a 1\xAA Pra\xE7a"
            ] })
          ] })
        ] }),
        keySpecs.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)(import_jsx_runtime47.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(Separator4, {}),
          /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("div", { className: "grid grid-cols-2 gap-2 text-sm", children: keySpecs.map((spec) => /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(InfoItem, { icon: spec.icon, value: `${spec.value}`, label: spec.label }, spec.label)) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)(DialogFooter, { className: "p-4 sm:p-6 border-t bg-background flex justify-between w-full flex-shrink-0", children: [
      /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("div", { className: "text-xs text-muted-foreground hidden sm:flex items-center gap-1.5", children: [
        /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(import_lucide_react27.CalendarDays, { className: "h-4 w-4" }),
        /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("span", { children: [
          "Prazo: ",
          formattedEndDate
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(Button, { asChild: true, size: "lg", onClick: onClose, children: /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)(import_link6.default, { href: lotDetailUrl, children: [
        /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(import_lucide_react27.Eye, { className: "mr-2 h-5 w-5" }),
        " Ver Detalhes e Dar Lance"
      ] }) })
    ] })
  ] }) });
}

// src/components/lot-card.tsx
var import_jsx_runtime48 = require("react/jsx-runtime");
function LotCardClientContent({ lot, auction, badgeVisibilityConfig, platformSettings, onUpdate }) {
  const [isFavorite, setIsFavorite] = React36.useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = React36.useState(false);
  const [isViewed, setIsViewed] = React36.useState(false);
  const hasEditPermission = true;
  const mentalTriggersGlobalSettings = platformSettings?.mentalTriggerSettings || {};
  const sectionBadges = badgeVisibilityConfig || platformSettings.sectionBadgeVisibility?.searchGrid || {
    showStatusBadge: true,
    showDiscountBadge: true,
    showUrgencyTimer: true,
    showPopularityBadge: true,
    showHotBidBadge: true,
    showExclusiveBadge: true
  };
  const showCountdownOnThisCard = platformSettings.showCountdownOnCards !== false;
  const { effectiveLotEndDate } = React36.useMemo(() => getEffectiveLotEndDate(lot, auction), [lot, auction]);
  const activeStage = React36.useMemo(() => getActiveStage(auction?.auctionStages), [auction]);
  const activeLotPrices = React36.useMemo(() => getLotPriceForStage(lot, activeStage?.id), [lot, activeStage]);
  React36.useEffect(() => {
    setIsFavorite(isLotFavoriteInStorage(lot.id));
    setIsViewed(getRecentlyViewedIds().includes(lot.id));
  }, [lot.id]);
  const handleFavoriteToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);
    if (newFavoriteState) {
      addFavoriteLotIdToStorage(lot.id);
    } else {
      removeFavoriteLotIdFromStorage(lot.id);
    }
  };
  const handlePreviewOpen = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPreviewModalOpen(true);
  };
  const displayLocation = lot.cityName && lot.stateUf ? `${lot.cityName} - ${lot.stateUf}` : lot.stateUf || lot.cityName || "N\xE3o informado";
  const lotDetailUrl = `/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`;
  const discountPercentage = React36.useMemo(() => {
    if (activeLotPrices?.initialBid && lot.evaluationValue && activeLotPrices.initialBid < lot.evaluationValue) {
      return Math.round((lot.evaluationValue - activeLotPrices.initialBid) / lot.evaluationValue * 100);
    }
    return lot.discountPercentage || 0;
  }, [activeLotPrices, lot.evaluationValue, lot.discountPercentage]);
  const mentalTriggers = React36.useMemo(() => {
    let triggers = lot.additionalTriggers ? [...lot.additionalTriggers] : [];
    const settings = mentalTriggersGlobalSettings;
    if (sectionBadges.showPopularityBadge !== false && settings.showPopularityBadge && (lot.views || 0) > (settings.popularityViewThreshold || 500)) {
      triggers.push("MAIS VISITADO");
    }
    if (sectionBadges.showHotBidBadge !== false && settings.showHotBidBadge && (lot.bidsCount || 0) > (settings.hotBidThreshold || 10) && lot.status === "ABERTO_PARA_LANCES") {
      triggers.push("LANCE QUENTE");
    }
    if (sectionBadges.showExclusiveBadge !== false && settings.showExclusiveBadge && lot.isExclusive) {
      triggers.push("EXCLUSIVO");
    }
    return Array.from(new Set(triggers));
  }, [lot.views, lot.bidsCount, lot.status, lot.additionalTriggers, lot.isExclusive, mentalTriggersGlobalSettings, sectionBadges]);
  const inheritedBem = lot.inheritedMediaFromBemId && lot.bens ? lot.bens.find((b) => b.id === lot.inheritedMediaFromBemId) : null;
  const imageUrlToDisplay = inheritedBem ? inheritedBem.imageUrl : lot.imageUrl;
  return /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)(import_jsx_runtime48.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)(Card, { "data-ai-id": `lot-card-container-${lot.id}`, className: "flex flex-col overflow-hidden h-full shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg group", children: [
      /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)("div", { className: "relative", children: [
        /* @__PURE__ */ (0, import_jsx_runtime48.jsx)(import_link7.default, { href: lotDetailUrl, className: "block", children: /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("div", { className: "aspect-video relative bg-muted", children: /* @__PURE__ */ (0, import_jsx_runtime48.jsx)(
          import_image4.default,
          {
            src: isValidImageUrl(imageUrlToDisplay) ? imageUrlToDisplay : "https://placehold.co/600x400.png",
            alt: lot.title,
            fill: true,
            sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
            className: "object-cover",
            "data-ai-id": `lot-card-main-image-${lot.id}`
          }
        ) }) }),
        /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)("div", { className: "absolute top-2 left-2 flex flex-col items-start gap-1 z-10", "data-ai-id": `lot-card-status-badges-${lot.id}`, children: [
          sectionBadges.showStatusBadge !== false && /* @__PURE__ */ (0, import_jsx_runtime48.jsx)(Badge, { className: `text-xs px-2 py-1 ${getLotStatusColor(lot.status)}`, children: getAuctionStatusText(lot.status) }),
          isViewed && /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)(Badge, { variant: "outline", className: "text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700", children: [
            /* @__PURE__ */ (0, import_jsx_runtime48.jsx)(import_lucide_react28.Eye, { className: "h-3 w-3 mr-0.5" }),
            " Visto"
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)("div", { className: "absolute top-2 right-2 flex flex-col items-end gap-1 z-10", "data-ai-id": `lot-card-mental-triggers-${lot.id}`, children: [
          sectionBadges.showDiscountBadge !== false && mentalTriggersGlobalSettings.showDiscountBadge && discountPercentage > 0 && /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)(Badge, { variant: "destructive", className: "text-xs animate-pulse", children: [
            /* @__PURE__ */ (0, import_jsx_runtime48.jsx)(import_lucide_react28.Percent, { className: "h-3 w-3 mr-1" }),
            " ",
            discountPercentage,
            "% OFF"
          ] }),
          mentalTriggers.map((trigger) => /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)(Badge, { variant: "secondary", className: "text-xs bg-amber-100 text-amber-700 border-amber-300", children: [
            trigger === "MAIS VISITADO" && /* @__PURE__ */ (0, import_jsx_runtime48.jsx)(import_lucide_react28.TrendingUp, { className: "h-3 w-3 mr-0.5" }),
            trigger === "LANCE QUENTE" && /* @__PURE__ */ (0, import_jsx_runtime48.jsx)(import_lucide_react28.Zap, { className: "h-3 w-3 mr-0.5 text-red-500 fill-red-500" }),
            trigger === "EXCLUSIVO" && /* @__PURE__ */ (0, import_jsx_runtime48.jsx)(import_lucide_react28.Crown, { className: "h-3 w-3 mr-0.5 text-purple-600" }),
            trigger
          ] }, trigger))
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("div", { className: "absolute bottom-2 left-1/2 z-20 flex w-full -translate-x-1/2 transform-gpu flex-row items-center justify-center space-x-1.5 opacity-0 transition-all duration-300 group-hover:-translate-y-0 group-hover:opacity-100 translate-y-4", children: /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)(TooltipProvider, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)(Tooltip, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime48.jsx)(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ (0, import_jsx_runtime48.jsx)(Button, { variant: "outline", size: "icon", className: "h-8 w-8 bg-background/80 hover:bg-background", onClick: handleFavoriteToggle, "aria-label": isFavorite ? "Desfavoritar" : "Favoritar", children: /* @__PURE__ */ (0, import_jsx_runtime48.jsx)(import_lucide_react28.Heart, { className: `h-4 w-4 ${isFavorite ? "text-red-500 fill-red-500" : "text-muted-foreground"}` }) }) }),
            /* @__PURE__ */ (0, import_jsx_runtime48.jsx)(TooltipContent, { children: /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("p", { children: isFavorite ? "Desfavoritar" : "Favoritar" }) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)(Tooltip, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime48.jsx)(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ (0, import_jsx_runtime48.jsx)(Button, { variant: "outline", size: "icon", className: "h-8 w-8 bg-background/80 hover:bg-background", onClick: handlePreviewOpen, "aria-label": "Pr\xE9-visualizar", children: /* @__PURE__ */ (0, import_jsx_runtime48.jsx)(import_lucide_react28.Eye, { className: "h-4 w-4 text-muted-foreground" }) }) }),
            /* @__PURE__ */ (0, import_jsx_runtime48.jsx)(TooltipContent, { children: /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("p", { children: "Pr\xE9-visualizar" }) })
          ] }),
          hasEditPermission && /* @__PURE__ */ (0, import_jsx_runtime48.jsx)(
            EntityEditMenu,
            {
              entityType: "lot",
              entityId: lot.id,
              publicId: lot.publicId,
              currentTitle: lot.title,
              isFeatured: lot.isFeatured || false,
              onUpdate
            }
          )
        ] }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)(CardContent, { className: "p-3 flex-grow space-y-1.5", children: [
        /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)("div", { className: "flex justify-between items-center text-xs text-muted-foreground", children: [
          /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)("div", { className: "flex items-center gap-1", "data-ai-id": `lot-card-category-${lot.id}`, children: [
            /* @__PURE__ */ (0, import_jsx_runtime48.jsx)(import_lucide_react28.Tag, { className: "h-3 w-3" }),
            /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("span", { children: lot.type })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)("div", { className: "flex items-center gap-1", "data-ai-id": `lot-card-bid-count-${lot.id}`, children: [
            /* @__PURE__ */ (0, import_jsx_runtime48.jsx)(import_lucide_react28.Gavel, { className: "h-3 w-3" }),
            /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)("span", { children: [
              lot.bidsCount || 0,
              " Lances"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime48.jsx)(import_link7.default, { href: lotDetailUrl, children: /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)("h3", { "data-ai-id": `lot-card-title-${lot.id}`, className: "text-sm font-semibold hover:text-primary transition-colors leading-tight min-h-[2.2em] line-clamp-2", children: [
          "Lote ",
          lot.number || lot.id.replace("LOTE", ""),
          " - ",
          lot.title
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)("div", { className: "flex items-center text-xs text-muted-foreground", "data-ai-id": `lot-card-location-${lot.id}`, children: [
          /* @__PURE__ */ (0, import_jsx_runtime48.jsx)(import_lucide_react28.MapPin, { className: "h-3 w-3 mr-1" }),
          /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("span", { children: displayLocation })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime48.jsx)(CardFooter, { className: "p-3 border-t flex-col items-start space-y-1.5", "data-ai-id": `lot-card-footer-${lot.id}`, children: /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("div", { className: "w-full flex justify-between items-end", "data-ai-id": `lot-card-price-section-${lot.id}`, children: /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)("div", { "data-ai-id": `lot-card-price-info-${lot.id}`, children: [
        /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("p", { className: "text-xs text-muted-foreground", children: lot.bidsCount && lot.bidsCount > 0 ? "Lance Atual" : "Lance Inicial" }),
        /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)("p", { className: `text-xl font-bold ${effectiveLotEndDate && (0, import_date_fns5.isPast)(effectiveLotEndDate) ? "text-muted-foreground line-through" : "text-primary"}`, children: [
          "R$ ",
          (activeLotPrices?.initialBid ?? lot.price).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        ] })
      ] }) }) })
    ] }),
    isPreviewModalOpen && /* @__PURE__ */ (0, import_jsx_runtime48.jsx)(
      LotPreviewModal,
      {
        lot,
        auction,
        platformSettings,
        isOpen: isPreviewModalOpen,
        onClose: () => setIsPreviewModalOpen(false)
      }
    )
  ] });
}
function LotCard(props) {
  const [isClient, setIsClient] = React36.useState(false);
  React36.useEffect(() => {
    setIsClient(true);
  }, []);
  if (!isClient) {
    return /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)(Card, { "data-ai-id": `lot-card-skeleton-${props.lot.id}`, className: "flex flex-col overflow-hidden h-full shadow-md rounded-lg", children: [
      /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("div", { className: "aspect-video relative bg-muted animate-pulse" }),
      /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)(CardContent, { className: "p-3 flex-grow space-y-1.5", children: [
        /* @__PURE__ */ (0, import_jsx_runtime48.jsx)(Skeleton, { className: "h-5 bg-muted rounded w-3/4" }),
        /* @__PURE__ */ (0, import_jsx_runtime48.jsx)(Skeleton, { className: "h-4 bg-muted rounded w-1/2" }),
        /* @__PURE__ */ (0, import_jsx_runtime48.jsx)(Skeleton, { className: "h-4 bg-muted rounded w-full" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)(CardFooter, { className: "p-3 border-t flex-col items-start space-y-1.5", children: [
        /* @__PURE__ */ (0, import_jsx_runtime48.jsx)(Skeleton, { className: "h-4 bg-muted rounded w-1/4" }),
        /* @__PURE__ */ (0, import_jsx_runtime48.jsx)(Skeleton, { className: "h-6 bg-muted rounded w-1/2" })
      ] })
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime48.jsx)(LotCardClientContent, { ...props });
}

// src/components/auction-list-item.tsx
var React37 = __toESM(require("react"));
var import_image5 = __toESM(require("next/image"));
var import_link8 = __toESM(require("next/link"));
var import_lucide_react29 = require("lucide-react");
var import_date_fns6 = require("date-fns");
var import_jsx_runtime49 = require("react/jsx-runtime");
function AuctionListItem({ auction, onUpdate }) {
  const auctionTypeDisplay = auction.auctionType === "TOMADA_DE_PRECOS" ? { label: "Tomada de Pre\xE7os", icon: /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(import_lucide_react29.FileText, { className: "h-3.5 w-3.5" }) } : { label: auction.auctionType || "Leil\xE3o", icon: /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(import_lucide_react29.Gavel, { className: "h-3.5 w-3.5" }) };
  const displayLocation = auction.cityId && auction.stateId ? `${auction.cityId} - ${auction.stateId}` : auction.stateId || auction.cityId || "N/A";
  const sellerName = auction.seller?.name;
  const mentalTriggers = React37.useMemo(() => {
    const triggers = [];
    const now = /* @__PURE__ */ new Date();
    if (auction.endDate) {
      const endDate = new Date(auction.endDate);
      if (!(0, import_date_fns6.isPast)(endDate)) {
        const daysDiff = (0, import_date_fns6.differenceInDays)(endDate, now);
        if (daysDiff === 0) triggers.push("ENCERRA HOJE");
        else if (daysDiff === 1) triggers.push("ENCERRA AMANH\xC3");
      }
    }
    if ((auction.totalHabilitatedUsers || 0) > 100) {
      triggers.push("ALTA DEMANDA");
    }
    if (auction.isFeaturedOnMarketplace) {
      triggers.push("DESTAQUE");
    }
    if (auction.additionalTriggers) {
      triggers.push(...auction.additionalTriggers);
    }
    return Array.from(new Set(triggers));
  }, [auction.endDate, auction.totalHabilitatedUsers, auction.isFeaturedOnMarketplace, auction.additionalTriggers]);
  const mainImageUrl = isValidImageUrl(auction.imageUrl) ? auction.imageUrl : `https://placehold.co/600x400.png?text=Leilao`;
  const sellerLogoUrl = isValidImageUrl(auction.seller?.logoUrl) ? auction.seller?.logoUrl : void 0;
  return /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(TooltipProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(Card, { className: "w-full shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg group overflow-hidden", children: /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("div", { className: "flex flex-col md:flex-row", children: [
    /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("div", { className: "md:w-1/3 lg:w-1/4 flex-shrink-0 relative aspect-video md:aspect-[4/3] bg-muted", children: [
      /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(import_link8.default, { href: `/auctions/${auction.publicId || auction.id}`, className: "block h-full w-full", children: /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(
        import_image5.default,
        {
          src: mainImageUrl,
          alt: auction.title,
          fill: true,
          className: "object-cover",
          "data-ai-hint": auction.dataAiHint || "imagem leilao lista"
        }
      ) }),
      sellerLogoUrl && /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)(Tooltip, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(import_link8.default, { href: auction.seller?.slug ? `/sellers/${auction.seller.slug}` : "#", onClick: (e) => e.stopPropagation(), className: "absolute bottom-1 right-1 z-10", children: /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)(Avatar, { className: "h-10 w-10 border-2 bg-background border-border shadow-md", children: [
          /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(AvatarImage, { src: sellerLogoUrl, alt: sellerName || "Logo Comitente", "data-ai-hint": auction.seller?.dataAiHintLogo || "logo comitente pequeno" }),
          /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(AvatarFallback, { children: sellerName ? sellerName.charAt(0) : "C" })
        ] }) }) }),
        /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(TooltipContent, { children: /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("p", { children: [
          "Comitente: ",
          sellerName
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("div", { className: "flex flex-col flex-grow p-4", children: [
      /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("div", { className: "flex justify-between items-start mb-1.5", children: [
        /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("div", { className: "flex-grow min-w-0", children: [
          /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("div", { className: "flex items-center gap-2 mb-1", children: [
            /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(
              Badge,
              {
                className: `text-xs px-1.5 py-0.5 shadow-sm
                            ${auction.status === "ABERTO_PARA_LANCES" || auction.status === "ABERTO" ? "bg-green-600 text-white" : ""}
                            ${auction.status === "EM_BREVE" ? "bg-blue-500 text-white" : ""}
                            ${auction.status === "ENCERRADO" || auction.status === "FINALIZADO" || auction.status === "CANCELADO" || auction.status === "SUSPENSO" || auction.status === "RASCUNHO" || auction.status === "EM_PREPARACAO" ? "bg-gray-500 text-white" : ""}
                        `,
                children: getAuctionStatusText(auction.status)
              }
            ),
            mentalTriggers.map((trigger) => /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(Badge, { variant: "secondary", className: "text-xs px-1 py-0.5 bg-amber-100 text-amber-700 border-amber-300", children: trigger }, trigger))
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(import_link8.default, { href: `/auctions/${auction.publicId || auction.id}`, children: /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("h3", { className: "text-base font-semibold hover:text-primary transition-colors leading-tight line-clamp-2 mr-2", title: auction.title, children: auction.title }) }),
          /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("p", { className: "text-xs text-muted-foreground mt-0.5 truncate", title: `ID: ${auction.publicId || auction.id}`, children: [
            "ID: ",
            auction.publicId || auction.id
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(
          EntityEditMenu,
          {
            entityType: "auction",
            entityId: auction.id,
            publicId: auction.publicId,
            currentTitle: auction.title,
            isFeatured: auction.isFeaturedOnMarketplace || false,
            onUpdate
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("div", { className: "flex items-center", children: [
          auctionTypeDisplay.icon && React37.cloneElement(auctionTypeDisplay.icon, { className: "h-3.5 w-3.5 mr-1.5 text-primary/80" }),
          /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("span", { children: auctionTypeDisplay.label })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("div", { className: "flex items-center", children: [
          /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(import_lucide_react29.Tag, { className: "h-3.5 w-3.5 mr-1.5 text-primary/80" }),
          /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("span", { children: auction.category?.name || "N\xE3o especificada" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("div", { className: "flex items-center", children: [
          /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(import_lucide_react29.MapPin, { className: "h-3.5 w-3.5 mr-1.5 text-primary/80" }),
          /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("span", { className: "truncate", children: displayLocation })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("div", { className: "flex items-center", children: [
          /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(import_lucide_react29.Eye, { className: "h-3.5 w-3.5 mr-1.5 text-primary/80" }),
          /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("span", { children: [
            auction.visits || 0,
            " Visitas"
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("div", { className: "flex items-center", children: [
          /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(import_lucide_react29.ListChecks, { className: "h-3.5 w-3.5 mr-1.5 text-primary/80" }),
          /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("span", { className: "truncate", children: [
            auction.totalLots || 0,
            " Lotes"
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("div", { className: "flex items-center", children: [
          /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(import_lucide_react29.Users, { className: "h-3.5 w-3.5 mr-1.5 text-primary/80" }),
          /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("span", { className: "truncate", children: [
            auction.totalHabilitatedUsers || 0,
            " Habilitados"
          ] })
        ] })
      ] }),
      auction.auctionStages && auction.auctionStages.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("div", { className: "my-2 p-3 bg-muted/30 rounded-md", children: /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(AuctionStagesTimeline, { stages: auction.auctionStages }) }),
      /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("div", { className: "mt-auto flex flex-col md:flex-row md:items-end justify-between gap-3 pt-2 border-t border-dashed", children: [
        /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("div", { className: "flex-shrink-0", children: [
          /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("p", { className: "text-xs text-muted-foreground", children: auction.auctionType === "TOMADA_DE_PRECOS" ? "Valor de Refer\xEAncia" : "A partir de" }),
          /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("p", { className: "text-xl font-bold text-primary", children: [
            "R$ ",
            (auction.initialOffer || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(Button, { asChild: true, size: "sm", className: "w-full md:w-auto mt-2 md:mt-0", children: /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)(import_link8.default, { href: `/auctions/${auction.publicId || auction.id}`, children: [
          /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(import_lucide_react29.Eye, { className: "mr-2 h-4 w-4" }),
          " Ver Leil\xE3o (",
          auction.totalLots,
          ")"
        ] }) })
      ] })
    ] })
  ] }) }) });
}

// src/components/lot-list-item.tsx
var React38 = __toESM(require("react"));
var import_image6 = __toESM(require("next/image"));
var import_link9 = __toESM(require("next/link"));
var import_lucide_react30 = require("lucide-react");
var import_date_fns7 = require("date-fns");
var import_jsx_runtime50 = require("react/jsx-runtime");
function LotListItemClientContent({ lot, auction, platformSettings, onUpdate }) {
  const [isPreviewModalOpen, setIsPreviewModalOpen] = React38.useState(false);
  const hasEditPermission = true;
  const { effectiveLotEndDate } = React38.useMemo(() => getEffectiveLotEndDate(lot, auction), [lot, auction]);
  const activeStage = React38.useMemo(() => getActiveStage(auction?.auctionStages), [auction]);
  const activeLotPrices = React38.useMemo(() => getLotPriceForStage(lot, activeStage?.id), [lot, activeStage]);
  const displayLocation = lot.cityName && lot.stateUf ? `${lot.cityName} - ${lot.stateUf}` : lot.stateUf || lot.cityName || "N\xE3o informado";
  const lotDetailUrl = `/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`;
  const inheritedBem = lot.inheritedMediaFromBemId && lot.bens ? lot.bens.find((b) => b.id === lot.inheritedMediaFromBemId) : null;
  const imageUrlToDisplay = inheritedBem ? inheritedBem.imageUrl : lot.imageUrl;
  const getTypeIcon = (type) => {
    if (!type) {
      return /* @__PURE__ */ (0, import_jsx_runtime50.jsx)(import_lucide_react30.Info, { className: "h-3.5 w-3.5 text-muted-foreground" });
    }
    const upperType = type.toUpperCase();
    if (upperType.includes("CASA") || upperType.includes("IM\xD3VEL") || upperType.includes("APARTAMENTO")) {
      return /* @__PURE__ */ (0, import_jsx_runtime50.jsx)(import_lucide_react30.Building, { className: "h-3.5 w-3.5 text-muted-foreground" });
    }
    if (upperType.includes("VE\xCDCULO") || upperType.includes("AUTOM\xD3VEL") || upperType.includes("CARRO")) {
      return /* @__PURE__ */ (0, import_jsx_runtime50.jsx)(import_lucide_react30.Car, { className: "h-3.5 w-3.5 text-muted-foreground" });
    }
    if (upperType.includes("MAQUIN\xC1RIO") || upperType.includes("TRATOR")) {
      return /* @__PURE__ */ (0, import_jsx_runtime50.jsx)(import_lucide_react30.Truck, { className: "h-3.5 w-3.5 text-muted-foreground" });
    }
    return /* @__PURE__ */ (0, import_jsx_runtime50.jsx)(import_lucide_react30.Info, { className: "h-3.5 w-3.5 text-muted-foreground" });
  };
  return /* @__PURE__ */ (0, import_jsx_runtime50.jsxs)(import_jsx_runtime50.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime50.jsx)(Card, { className: "w-full shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg group overflow-hidden", "data-ai-id": `lot-list-item-container-${lot.id}`, children: /* @__PURE__ */ (0, import_jsx_runtime50.jsxs)("div", { className: "flex flex-col md:flex-row", children: [
      /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("div", { className: "md:w-1/3 lg:w-1/4 flex-shrink-0 relative aspect-video md:aspect-[4/3] bg-muted", children: /* @__PURE__ */ (0, import_jsx_runtime50.jsx)(import_link9.default, { href: lotDetailUrl, className: "block h-full w-full", children: /* @__PURE__ */ (0, import_jsx_runtime50.jsx)(
        import_image6.default,
        {
          src: isValidImageUrl(imageUrlToDisplay) ? imageUrlToDisplay : "https://placehold.co/600x400.png",
          alt: lot.title,
          fill: true,
          className: "object-cover",
          "data-ai-hint": lot.dataAiHint || "imagem lote lista",
          "data-ai-id": `lot-list-item-image-${lot.id}`
        }
      ) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime50.jsxs)("div", { className: "flex flex-col flex-grow p-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime50.jsxs)("div", { className: "flex justify-between items-start mb-1.5", children: [
          /* @__PURE__ */ (0, import_jsx_runtime50.jsxs)("div", { className: "flex-grow min-w-0", children: [
            /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("div", { className: "flex items-center gap-2 mb-1", "data-ai-id": `lot-list-item-badges-${lot.id}`, children: /* @__PURE__ */ (0, import_jsx_runtime50.jsx)(Badge, { className: `text-xs px-1.5 py-0.5 ${getLotStatusColor(lot.status)}`, children: getAuctionStatusText(lot.status) }) }),
            /* @__PURE__ */ (0, import_jsx_runtime50.jsx)(import_link9.default, { href: lotDetailUrl, children: /* @__PURE__ */ (0, import_jsx_runtime50.jsxs)("h3", { className: "text-base font-semibold hover:text-primary transition-colors leading-tight line-clamp-2 mr-2", title: lot.title, "data-ai-id": `lot-list-item-title-${lot.id}`, children: [
              "Lote ",
              lot.number || lot.id.replace("LOTE", ""),
              " - ",
              lot.title
            ] }) })
          ] }),
          hasEditPermission && /* @__PURE__ */ (0, import_jsx_runtime50.jsx)(EntityEditMenu, { entityType: "lot", entityId: lot.id, publicId: lot.publicId, currentTitle: lot.title, isFeatured: lot.isFeatured || false, onUpdate })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime50.jsxs)("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2", "data-ai-id": `lot-list-item-details-${lot.id}`, children: [
          /* @__PURE__ */ (0, import_jsx_runtime50.jsxs)("div", { className: "flex items-center", title: `Categoria: ${lot.type}`, children: [
            getTypeIcon(lot.type),
            /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("span", { className: "truncate ml-1", children: lot.type })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime50.jsxs)("div", { className: "flex items-center", children: [
            /* @__PURE__ */ (0, import_jsx_runtime50.jsx)(import_lucide_react30.MapPin, { className: "h-3.5 w-3.5 mr-1.5 text-primary/80" }),
            /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("span", { className: "truncate", title: displayLocation, children: displayLocation })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime50.jsxs)("div", { className: "flex items-center", children: [
            /* @__PURE__ */ (0, import_jsx_runtime50.jsx)(import_lucide_react30.Gavel, { className: "h-3.5 w-3.5 mr-1.5 text-primary/80" }),
            /* @__PURE__ */ (0, import_jsx_runtime50.jsxs)("span", { className: "truncate", children: [
              lot.bidsCount || 0,
              " Lances"
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime50.jsxs)("div", { className: "flex items-center", children: [
            /* @__PURE__ */ (0, import_jsx_runtime50.jsx)(import_lucide_react30.Eye, { className: "h-3.5 w-3.5 mr-1.5 text-primary/80" }),
            /* @__PURE__ */ (0, import_jsx_runtime50.jsxs)("span", { className: "truncate", children: [
              lot.views || 0,
              " Visitas"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("p", { className: "text-sm text-muted-foreground line-clamp-2 mb-3", children: lot.description }),
        /* @__PURE__ */ (0, import_jsx_runtime50.jsxs)("div", { className: "mt-auto flex flex-col md:flex-row md:items-end justify-between gap-3 pt-2 border-t border-dashed", "data-ai-id": `lot-list-item-footer-${lot.id}`, children: [
          /* @__PURE__ */ (0, import_jsx_runtime50.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("p", { className: "text-xs text-muted-foreground", children: lot.bidsCount && lot.bidsCount > 0 ? "Lance Atual" : "Lance Inicial" }),
            /* @__PURE__ */ (0, import_jsx_runtime50.jsxs)("p", { className: `text-xl font-bold ${effectiveLotEndDate && (0, import_date_fns7.isPast)(effectiveLotEndDate) ? "text-muted-foreground line-through" : "text-primary"}`, children: [
              "R$ ",
              (activeLotPrices?.initialBid ?? lot.price).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime50.jsx)(Button, { asChild: true, size: "sm", className: "w-full md:w-auto mt-2 md:mt{0}", children: /* @__PURE__ */ (0, import_jsx_runtime50.jsxs)(import_link9.default, { href: lotDetailUrl, children: [
            /* @__PURE__ */ (0, import_jsx_runtime50.jsx)(import_lucide_react30.Eye, { className: "mr-2 h-4 w-4" }),
            " Ver Detalhes"
          ] }) })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime50.jsx)(
      LotPreviewModal,
      {
        lot,
        auction,
        platformSettings,
        isOpen: isPreviewModalOpen,
        onClose: () => setIsPreviewModalOpen(false)
      }
    )
  ] });
}
function LotListItem(props) {
  const [isClient, setIsClient] = React38.useState(false);
  React38.useEffect(() => {
    setIsClient(true);
  }, []);
  if (!isClient) {
    return /* @__PURE__ */ (0, import_jsx_runtime50.jsxs)(Card, { className: "flex flex-row overflow-hidden h-full shadow-md rounded-lg group", children: [
      /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("div", { className: "relative aspect-square h-full bg-muted animate-pulse w-1/3 md:w-1/4 flex-shrink-0" }),
      /* @__PURE__ */ (0, import_jsx_runtime50.jsxs)("div", { className: "flex flex-col flex-grow", children: [
        /* @__PURE__ */ (0, import_jsx_runtime50.jsxs)(CardContent, { className: "p-4 flex-grow space-y-1.5", children: [
          /* @__PURE__ */ (0, import_jsx_runtime50.jsx)(Skeleton, { className: "h-5 bg-muted rounded w-3/4" }),
          /* @__PURE__ */ (0, import_jsx_runtime50.jsx)(Skeleton, { className: "h-4 bg-muted rounded w-1/2" }),
          /* @__PURE__ */ (0, import_jsx_runtime50.jsx)(Skeleton, { className: "h-4 bg-muted rounded w-full" }),
          /* @__PURE__ */ (0, import_jsx_runtime50.jsx)(Skeleton, { className: "h-4 bg-muted rounded w-2/3" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime50.jsxs)("div", { className: "p-4 border-t flex flex-col md:flex-row items-start md:items-center justify-between gap-3", children: [
          /* @__PURE__ */ (0, import_jsx_runtime50.jsxs)("div", { className: "flex-grow", children: [
            /* @__PURE__ */ (0, import_jsx_runtime50.jsx)(Skeleton, { className: "h-4 bg-muted rounded w-1/4" }),
            /* @__PURE__ */ (0, import_jsx_runtime50.jsx)(Skeleton, { className: "h-6 bg-muted rounded w-1/2 mt-1" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime50.jsx)(Skeleton, { className: "h-9 bg-muted rounded w-full md:w-auto" })
        ] })
      ] })
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime50.jsx)(LotListItemClientContent, { ...props });
}

// src/components/direct-sale-offer-card.tsx
var import_image7 = __toESM(require("next/image"));
var import_link10 = __toESM(require("next/link"));
var import_lucide_react31 = require("lucide-react");
var import_jsx_runtime51 = require("react/jsx-runtime");
function DirectSaleOfferCard({ offer }) {
  const displayLocation = offer.locationCity && offer.locationState ? `${offer.locationCity} - ${offer.locationState}` : offer.locationState || offer.locationCity || "N\xE3o informado";
  return /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)(Card, { className: "flex flex-col overflow-hidden h-full shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg group", "data-ai-id": `direct-sale-card-container-${offer.id}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("div", { className: "relative", children: /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(import_link10.default, { href: `/direct-sales/${offer.id}`, className: "block", children: /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("div", { className: "aspect-[16/10] relative bg-muted", children: [
      /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(
        import_image7.default,
        {
          src: offer.imageUrl || "https://placehold.co/600x400.png",
          alt: offer.title,
          fill: true,
          sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
          className: "object-cover",
          "data-ai-hint": offer.dataAiHint || "oferta venda direta",
          "data-ai-id": `direct-sale-card-image-${offer.id}`
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(Badge, { className: `absolute top-2 left-2 text-xs px-2 py-1 ${getLotStatusColor(offer.status)}`, children: getAuctionStatusText(offer.status) }),
      /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(Badge, { variant: "outline", className: "absolute top-2 right-2 text-xs px-2 py-1 bg-background/80", children: offer.offerType === "BUY_NOW" ? "Comprar J\xE1" : "Aceita Proposta" })
    ] }) }) }),
    /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)(CardContent, { className: "p-3 flex-grow space-y-1.5", children: [
      /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("div", { className: "flex justify-between items-center text-xs text-muted-foreground", children: [
        /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("div", { className: "flex items-center gap-1 truncate", children: [
          /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(import_lucide_react31.UserCircle, { className: "h-3.5 w-3.5 flex-shrink-0" }),
          /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("span", { className: "truncate", children: offer.sellerName })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("div", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(import_lucide_react31.Tag, { className: "h-3 w-3" }),
          /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("span", { children: offer.category })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(import_link10.default, { href: `/direct-sales/${offer.id}`, children: /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("h3", { className: "text-sm font-semibold hover:text-primary transition-colors leading-tight min-h-[2.2em] line-clamp-2", "data-ai-id": `direct-sale-card-title-${offer.id}`, children: offer.title }) }),
      /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("div", { className: "flex items-center text-xs text-muted-foreground", children: [
        /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(import_lucide_react31.MapPin, { className: "h-3 w-3 mr-1" }),
        /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("span", { children: displayLocation })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)(CardFooter, { className: "p-3 border-t flex-col items-start space-y-1.5", children: [
      /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("div", { className: "w-full", children: [
        offer.offerType === "BUY_NOW" && offer.price !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)(import_jsx_runtime51.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("p", { className: "text-xs text-muted-foreground", children: "Pre\xE7o Fixo" }),
          /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("p", { className: "text-xl font-bold text-primary", children: [
            "R$ ",
            offer.price.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          ] })
        ] }),
        offer.offerType === "ACCEPTS_PROPOSALS" && /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)(import_jsx_runtime51.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("p", { className: "text-xs text-muted-foreground", children: "Aceita Propostas" }),
          offer.minimumOfferPrice ? /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("p", { className: "text-md font-bold text-primary", children: [
            "A partir de R$ ",
            offer.minimumOfferPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("p", { className: "text-md font-bold text-primary", children: "Envie sua proposta" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(Button, { asChild: true, className: "w-full mt-2", size: "sm", children: /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)(import_link10.default, { href: `/direct-sales/${offer.id}`, children: [
        /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(import_lucide_react31.Eye, { className: "mr-2 h-4 w-4" }),
        " Ver Detalhes"
      ] }) })
    ] })
  ] });
}

// src/components/direct-sale-offer-list-item.tsx
var import_lucide_react32 = require("lucide-react");
var import_link11 = __toESM(require("next/link"));
var import_jsx_runtime52 = require("react/jsx-runtime");
function DirectSaleOfferListItem({ offer }) {
  return /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(Card, { className: "w-full shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg group overflow-hidden", children: /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(CardContent, { className: "p-4", children: /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)(import_link11.default, { href: `/direct-sales/${offer.id}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("h3", { className: "font-semibold hover:text-primary", children: offer.title }),
    /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("div", { className: "flex items-center text-sm text-muted-foreground gap-2 mt-1", children: [
      /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(import_lucide_react32.Tag, { className: "h-4 w-4" }),
      /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("span", { children: offer.category }),
      /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("span", { children: "-" }),
      /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("span", { children: offer.sellerName })
    ] })
  ] }) }) });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertTitle,
  AuctionCard,
  AuctionListItem,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Calendar,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
  DataTable,
  DataTableColumnHeader,
  DataTableFacetedFilter,
  DataTablePagination,
  DataTableToolbar,
  DataTableViewOptions,
  DirectSaleOfferCard,
  DirectSaleOfferListItem,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Label,
  LotCard,
  LotListItem,
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarPortal,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Progress,
  RadioGroup,
  RadioGroupItem,
  ScrollArea,
  ScrollBar,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  Separator,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
  Skeleton,
  Slider,
  Switch,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  Toaster,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  addFavoriteLotIdToStorage,
  addRecentlyViewedId,
  badgeVariants,
  buttonVariants,
  cn,
  createEntitySelectorColumns,
  getActiveStage,
  getAuctionStatusColor,
  getAuctionStatusText,
  getCategoryAssets,
  getEffectiveLotEndDate,
  getFavoriteLotIdsFromStorage,
  getLotPriceForStage,
  getLotStatusColor,
  getPaymentStatusText,
  getRecentlyViewedIds,
  getUniqueLotLocations,
  getUserDocumentStatusColor,
  getUserDocumentStatusInfo,
  getUserHabilitationStatusInfo,
  isLotFavoriteInStorage,
  isValidImageUrl,
  navigationMenuTriggerStyle,
  removeFavoriteLotIdFromStorage,
  removeRecentlyViewedId,
  slugify,
  useFormField
});
