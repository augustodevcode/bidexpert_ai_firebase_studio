// src/components/dashboard/bidder/profile-section.tsx
/**
 * @fileoverview Seção de perfil no dashboard do bidder
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  User,
  Edit,
  Save,
  X,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Shield,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { BidderProfile, BidderDocumentStatus } from '@/types/bidder-dashboard';

interface ProfileSectionProps {}

export function ProfileSection({}: ProfileSectionProps) {
  const [profile, setProfile] = useState<BidderProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  // TODO: Implementar hooks para buscar dados
  // const { profile, updateProfile, loading } = useBidderProfile();

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        cpf: profile.cpf || '',
        phone: profile.phone || '',
        dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.toISOString().split('T')[0] : '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        zipCode: profile.zipCode || '',
        emailNotifications: profile.emailNotifications,
        smsNotifications: profile.smsNotifications
      });
    }
  }, [profile]);

  const handleSave = async () => {
    setLoading(true);
    try {
      // TODO: Implementar atualização do perfil
      console.log('Saving profile:', formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        cpf: profile.cpf || '',
        phone: profile.phone || '',
        dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.toISOString().split('T')[0] : '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        zipCode: profile.zipCode || '',
        emailNotifications: profile.emailNotifications,
        smsNotifications: profile.smsNotifications
      });
    }
  };

  const getDocumentStatusBadge = (status: BidderDocumentStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="secondary"><Shield className="h-3 w-3 mr-1" />Em Análise</Badge>;
      case 'APPROVED':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Aprovado</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Rejeitado</Badge>;
      case 'EXPIRED':
        return <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" />Expirado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!profile) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">Carregando perfil...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Meu Perfil
            </CardTitle>
            <CardDescription>
              Gerencie suas informações pessoais e preferências
            </CardDescription>
          </div>
          <Button
            variant={isEditing ? "outline" : "default"}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </>
            ) : (
              <>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Profile Picture and Basic Info */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-10 w-10 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">
                  {profile.fullName || 'Nome não informado'}
                </h3>
                <p className="text-muted-foreground">
                  {profile.cpf || 'CPF não informado'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {getDocumentStatusBadge(profile.documentStatus)}
                  <Badge variant={profile.isActive ? 'default' : 'secondary'}>
                    {profile.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">Informações de Contato</h4>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Email: {profile.user.email}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {isEditing ? (
                        <Input
                          value={formData.phone || ''}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="Digite seu telefone"
                        />
                      ) : (
                        profile.phone || 'Telefone não informado'
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {isEditing ? (
                        <Input
                          type="date"
                          value={formData.dateOfBirth || ''}
                          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        />
                      ) : (
                        profile.dateOfBirth
                          ? profile.dateOfBirth.toLocaleDateString('pt-BR')
                          : 'Data de nascimento não informada'
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Endereço</h4>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {isEditing ? (
                        <Input
                          value={formData.address || ''}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          placeholder="Digite seu endereço"
                        />
                      ) : (
                        profile.address || 'Endereço não informado'
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-xs text-muted-foreground">Cidade:</span>
                      {isEditing ? (
                        <Input
                          value={formData.city || ''}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="Cidade"
                        />
                      ) : (
                        <p className="text-sm">{profile.city || 'Não informado'}</p>
                      )}
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Estado:</span>
                      {isEditing ? (
                        <Input
                          value={formData.state || ''}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          placeholder="Estado"
                        />
                      ) : (
                        <p className="text-sm">{profile.state || 'Não informado'}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-muted-foreground">CEP:</span>
                    {isEditing ? (
                      <Input
                        value={formData.zipCode || ''}
                        onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                        placeholder="CEP"
                      />
                    ) : (
                      <p className="text-sm">{profile.zipCode || 'Não informado'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="space-y-4">
              <h4 className="font-medium">Preferências de Notificação</h4>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Notificações por Email</div>
                    <div className="text-sm text-muted-foreground">
                      Receber emails sobre arremates, pagamentos e atualizações
                    </div>
                  </div>
                  <Switch
                    checked={formData.emailNotifications}
                    onCheckedChange={(checked) => setFormData({ ...formData, emailNotifications: checked })}
                    disabled={!isEditing}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Notificações por SMS</div>
                    <div className="text-sm text-muted-foreground">
                      Receber mensagens SMS sobre arremates importantes
                    </div>
                  </div>
                  <Switch
                    checked={formData.smsNotifications}
                    onCheckedChange={(checked) => setFormData({ ...formData, smsNotifications: checked })}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>

            {/* Personal Information (Editable) */}
            {isEditing && (
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium">Informações Pessoais</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome Completo</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName || ''}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Digite seu nome completo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf || ''}
                      onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Save/Cancel Buttons */}
            {isEditing && (
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={handleCancel} disabled={loading}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? (
                    'Salvando...'
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Account Information */}
            <div className="pt-6 border-t">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-sm font-medium text-muted-foreground">Membro desde</div>
                  <div className="font-medium">
                    {profile.createdAt.toLocaleDateString('pt-BR')}
                  </div>
                </div>

                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-sm font-medium text-muted-foreground">Última atualização</div>
                  <div className="font-medium">
                    {profile.updatedAt.toLocaleDateString('pt-BR')}
                  </div>
                </div>

                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-sm font-medium text-muted-foreground">Status da conta</div>
                  <div className="font-medium">
                    {profile.isActive ? 'Ativa' : 'Inativa'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Status dos Documentos
          </CardTitle>
          <CardDescription>
            Status atual da análise dos seus documentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium">Documentação Completa</div>
                  <div className="text-sm text-muted-foreground">
                    Todos os documentos necessários foram analisados
                  </div>
                </div>
              </div>
              {getDocumentStatusBadge(profile.documentStatus)}
            </div>

            {profile.documentStatus === 'REJECTED' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-red-800">Documentos Rejeitados</span>
                </div>
                <p className="text-sm text-red-700 mb-3">
                  Alguns documentos foram rejeitados. Verifique as correções necessárias e envie novamente.
                </p>
                <Button size="sm" variant="outline">
                  Ver Detalhes da Rejeição
                </Button>
              </div>
            )}

            {profile.documentStatus === 'PENDING' && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <span className="font-medium text-orange-800">Documentos em Análise</span>
                </div>
                <p className="text-sm text-orange-700">
                  Seus documentos estão sendo analisados. O processo pode levar até 24 horas úteis.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
