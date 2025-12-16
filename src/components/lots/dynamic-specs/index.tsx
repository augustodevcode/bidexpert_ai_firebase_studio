/**
 * @file src/components/lots/dynamic-specs/index.tsx
 * @description Componente de especificações dinâmicas baseadas em templates de categoria.
 * Renderiza specs técnicos de forma flexível para Eletrônicos e outras categorias.
 * 
 * Gap 3.1 - Specs técnicos por template + gap 3.2 - Preço varejo
 */

"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Cpu, HardDrive, Monitor, Smartphone, Camera, Wifi, Battery, AlertCircle, CheckCircle2, Info } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export interface SpecFieldTemplate {
  fieldKey: string;
  label: string;
  unit?: string;
  importance: "critical" | "high" | "medium" | "low";
  tooltip?: string;
  icon?: string;
}

export interface SpecField extends SpecFieldTemplate {
  value: string | number | boolean | null;
}

export interface SpecGroupTemplate {
  groupName: string;
  fields: SpecFieldTemplate[];
}

export interface SpecGroup {
  groupName: string;
  fields: SpecField[];
}

export interface CategorySpecTemplate {
  categoryId: string;
  categoryName: string;
  templateVersion: string;
  groups: SpecGroupTemplate[];
}

export interface DynamicSpecsProps {
  template: CategorySpecTemplate | null;
  assetSpecs: Record<string, unknown>;
  showEmptyFields?: boolean;
  compact?: boolean;
  className?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

const getIconComponent = (iconName?: string) => {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    cpu: Cpu,
    storage: HardDrive,
    display: Monitor,
    smartphone: Smartphone,
    camera: Camera,
    wifi: Wifi,
    battery: Battery,
  };
  return iconName ? icons[iconName.toLowerCase()] : null;
};

const _getImportanceBadgeVariant = (importance: SpecFieldTemplate["importance"]) => {
  const variants: Record<string, "destructive" | "default" | "secondary" | "outline"> = {
    critical: "destructive",
    high: "default",
    medium: "secondary",
    low: "outline",
  };
  return variants[importance] || "outline";
};

const formatValue = (value: unknown, unit?: string): string => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (typeof value === "number") {
    const formatted = value.toLocaleString("pt-BR");
    return unit ? `${formatted} ${unit}` : formatted;
  }
  return String(value);
};

// ============================================================================
// Sub-components
// ============================================================================

interface SpecFieldItemProps {
  field: SpecFieldTemplate;
  value: unknown;
  compact?: boolean;
}

const SpecFieldItem: React.FC<SpecFieldItemProps> = ({ field, value, compact }) => {
  const IconComponent = getIconComponent(field.icon);
  const displayValue = formatValue(value, field.unit);
  const isEmpty = value === null || value === undefined;

  if (compact) {
    return (
      <div className="flex items-center justify-between py-1 text-sm border-b border-border/50 last:border-0">
        <span className="text-muted-foreground flex items-center gap-1">
          {IconComponent && <IconComponent className="h-3 w-3" />}
          {field.label}
        </span>
        <span className={isEmpty ? "text-muted-foreground/50" : "font-medium"}>
          {displayValue}
        </span>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            {IconComponent && (
              <div className="mt-0.5 p-2 rounded-md bg-background">
                <IconComponent className="h-4 w-4 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">{field.label}</span>
                {field.importance === "critical" && (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                    Crítico
                  </Badge>
                )}
                {field.tooltip && (
                  <Info className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
              <div className={`text-lg font-semibold ${isEmpty ? "text-muted-foreground/50" : ""}`}>
                {displayValue}
              </div>
            </div>
            {!isEmpty && (
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-1" />
            )}
          </div>
        </TooltipTrigger>
        {field.tooltip && (
          <TooltipContent side="top" className="max-w-xs">
            <p>{field.tooltip}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};

interface SpecGroupSectionProps {
  group: SpecGroupTemplate;
  assetSpecs: Record<string, unknown>;
  showEmptyFields: boolean;
  compact?: boolean;
}

const SpecGroupSection: React.FC<SpecGroupSectionProps> = ({
  group,
  assetSpecs,
  showEmptyFields,
  compact,
}) => {
  const visibleFields = useMemo(() => {
    return group.fields.filter((field) => {
      const value = assetSpecs[field.fieldKey];
      return showEmptyFields || (value !== null && value !== undefined);
    });
  }, [group.fields, assetSpecs, showEmptyFields]);

  if (visibleFields.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        {group.groupName}
      </h4>
      <div className={compact ? "space-y-0" : "grid grid-cols-1 sm:grid-cols-2 gap-3"}>
        {visibleFields.map((field) => (
          <SpecFieldItem
            key={field.fieldKey}
            field={field}
            value={assetSpecs[field.fieldKey]}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * DynamicSpecs - Renderiza especificações técnicas baseadas em template de categoria
 * 
 * Funcionalidades:
 * - Renderização dinâmica baseada em CategorySpecTemplate
 * - Agrupamento de campos por categoria
 * - Indicadores de importância (crítico, alto, médio, baixo)
 * - Tooltips informativos
 * - Modo compacto para listagens
 * - Ícones por tipo de especificação
 */
export const DynamicSpecs: React.FC<DynamicSpecsProps> = ({
  template,
  assetSpecs,
  showEmptyFields = false,
  compact = false,
  className = "",
}) => {
  // Calculate fill rate
  const fillRate = useMemo(() => {
    if (!template) return 0;
    const allFields = template.groups.flatMap((g) => g.fields);
    const filledFields = allFields.filter((f) => {
      const value = assetSpecs[f.fieldKey];
      return value !== null && value !== undefined && value !== "";
    });
    return Math.round((filledFields.length / allFields.length) * 100);
  }, [template, assetSpecs]);

  if (!template) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-muted-foreground">
            Template de especificações não disponível para esta categoria.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              Especificações Técnicas
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {template.categoryName} • v{template.templateVersion}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{fillRate}%</div>
            <div className="text-xs text-muted-foreground">Preenchido</div>
          </div>
        </div>
        {/* Fill rate indicator */}
        <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              fillRate >= 80
                ? "bg-green-500"
                : fillRate >= 50
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
            style={{ width: `${fillRate}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {template.groups.map((group, idx) => (
          <SpecGroupSection
            key={`${group.groupName}-${idx}`}
            group={group}
            assetSpecs={assetSpecs}
            showEmptyFields={showEmptyFields}
            compact={compact}
          />
        ))}
      </CardContent>
    </Card>
  );
};

// ============================================================================
// Template Presets
// ============================================================================

/**
 * Templates predefinidos para categorias comuns de eletrônicos
 */
export const ELECTRONICS_TEMPLATES: Record<string, CategorySpecTemplate> = {
  smartphone: {
    categoryId: "electronics_smartphone",
    categoryName: "Smartphone",
    templateVersion: "1.0",
    groups: [
      {
        groupName: "Tela",
        fields: [
          { fieldKey: "screenSize", label: "Tamanho", unit: '"', importance: "high", icon: "display" },
          { fieldKey: "screenResolution", label: "Resolução", importance: "medium", icon: "display" },
          { fieldKey: "screenType", label: "Tecnologia", importance: "medium", icon: "display", tooltip: "AMOLED, LCD, IPS, etc." },
        ],
      },
      {
        groupName: "Processamento",
        fields: [
          { fieldKey: "processor", label: "Processador", importance: "critical", icon: "cpu" },
          { fieldKey: "ram", label: "Memória RAM", unit: "GB", importance: "critical", icon: "cpu" },
          { fieldKey: "storage", label: "Armazenamento", unit: "GB", importance: "high", icon: "storage" },
        ],
      },
      {
        groupName: "Câmera",
        fields: [
          { fieldKey: "mainCamera", label: "Câmera Principal", unit: "MP", importance: "high", icon: "camera" },
          { fieldKey: "frontCamera", label: "Câmera Frontal", unit: "MP", importance: "medium", icon: "camera" },
          { fieldKey: "videoCapability", label: "Gravação de Vídeo", importance: "low", icon: "camera" },
        ],
      },
      {
        groupName: "Bateria e Conectividade",
        fields: [
          { fieldKey: "batteryCapacity", label: "Bateria", unit: "mAh", importance: "high", icon: "battery" },
          { fieldKey: "connectivity5G", label: "Suporte 5G", importance: "medium", icon: "wifi" },
          { fieldKey: "wirelessCharging", label: "Carregamento Sem Fio", importance: "low", icon: "battery" },
        ],
      },
    ],
  },
  notebook: {
    categoryId: "electronics_notebook",
    categoryName: "Notebook",
    templateVersion: "1.0",
    groups: [
      {
        groupName: "Tela",
        fields: [
          { fieldKey: "screenSize", label: "Tamanho", unit: '"', importance: "high", icon: "display" },
          { fieldKey: "screenResolution", label: "Resolução", importance: "medium", icon: "display" },
          { fieldKey: "screenRefreshRate", label: "Taxa de Atualização", unit: "Hz", importance: "low", icon: "display" },
        ],
      },
      {
        groupName: "Processamento",
        fields: [
          { fieldKey: "processor", label: "Processador", importance: "critical", icon: "cpu" },
          { fieldKey: "ram", label: "Memória RAM", unit: "GB", importance: "critical", icon: "cpu" },
          { fieldKey: "gpu", label: "Placa de Vídeo", importance: "high", icon: "cpu", tooltip: "Dedicada ou integrada" },
        ],
      },
      {
        groupName: "Armazenamento",
        fields: [
          { fieldKey: "storageType", label: "Tipo", importance: "high", icon: "storage", tooltip: "SSD, HDD ou híbrido" },
          { fieldKey: "storageCapacity", label: "Capacidade", unit: "GB", importance: "high", icon: "storage" },
          { fieldKey: "storageExpandable", label: "Expansível", importance: "low", icon: "storage" },
        ],
      },
      {
        groupName: "Bateria e Conectividade",
        fields: [
          { fieldKey: "batteryLife", label: "Autonomia", unit: "h", importance: "high", icon: "battery" },
          { fieldKey: "ports", label: "Portas", importance: "medium", tooltip: "USB-C, HDMI, etc." },
          { fieldKey: "wifi6", label: "WiFi 6", importance: "low", icon: "wifi" },
        ],
      },
    ],
  },
  tv: {
    categoryId: "electronics_tv",
    categoryName: "Smart TV",
    templateVersion: "1.0",
    groups: [
      {
        groupName: "Tela",
        fields: [
          { fieldKey: "screenSize", label: "Tamanho", unit: '"', importance: "critical", icon: "display" },
          { fieldKey: "screenResolution", label: "Resolução", importance: "critical", icon: "display", tooltip: "4K, 8K, Full HD" },
          { fieldKey: "panelType", label: "Tecnologia do Painel", importance: "high", icon: "display", tooltip: "OLED, QLED, LED" },
          { fieldKey: "refreshRate", label: "Taxa de Atualização", unit: "Hz", importance: "medium", icon: "display" },
          { fieldKey: "hdrSupport", label: "Suporte HDR", importance: "high", icon: "display" },
        ],
      },
      {
        groupName: "Smart Features",
        fields: [
          { fieldKey: "operatingSystem", label: "Sistema Operacional", importance: "high", tooltip: "Android TV, WebOS, Tizen" },
          { fieldKey: "voiceAssistant", label: "Assistente de Voz", importance: "medium" },
          { fieldKey: "appStore", label: "Loja de Apps", importance: "low" },
        ],
      },
      {
        groupName: "Áudio",
        fields: [
          { fieldKey: "speakerPower", label: "Potência de Som", unit: "W", importance: "medium" },
          { fieldKey: "dolbyAtmos", label: "Dolby Atmos", importance: "low" },
        ],
      },
      {
        groupName: "Conectividade",
        fields: [
          { fieldKey: "hdmiPorts", label: "Portas HDMI", importance: "high" },
          { fieldKey: "usbPorts", label: "Portas USB", importance: "medium" },
          { fieldKey: "bluetooth", label: "Bluetooth", importance: "low", icon: "wifi" },
        ],
      },
    ],
  },
};

export default DynamicSpecs;
