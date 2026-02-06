import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyNewTables() {
  console.log('\n🔍 VERIFICAÇÃO DAS NOVAS TABELAS GLOBAIS\n');
  console.log('===========================================\n');

  try {
    // 1. States
    const statesCount = await prisma.state.count();
    console.log(`✅ State                    : ${statesCount} registros`);

    // 2. Cities
    const citiesCount = await prisma.city.count();
    console.log(`✅ City                     : ${citiesCount} registros`);

    // 3. ValidationRules
    const validationRulesCount = await prisma.validation_rules.count();
    console.log(`✅ validation_rules         : ${validationRulesCount} registros`);

    // 4. VisitorEvents
    const visitorEventsCount = await prisma.visitor_events.count();
    console.log(`✅ visitor_events           : ${visitorEventsCount} registros`);

    // 5. VisitorSessions
    const visitorSessionsCount = await prisma.visitor_sessions.count();
    console.log(`✅ visitor_sessions         : ${visitorSessionsCount} registros`);

    // 6. ThemeSettings
    const themeSettingsCount = await prisma.themeSettings.count();
    console.log(`✅ ThemeSettings            : ${themeSettingsCount} registros`);

    // 7. ThemeColors
    const themeColorsCount = await prisma.themeColors.count();
    console.log(`✅ ThemeColors              : ${themeColorsCount} registros`);

    // Verificar tabelas opcionais (que podem não existir)
    console.log('\n📋 TABELAS OPCIONAIS:\n');

    try {
      const sectionBadgeCount = await (prisma as any).sectionBadgeVisibility.count();
      console.log(`✅ SectionBadgeVisibility   : ${sectionBadgeCount} registros`);
    } catch (e) {
      console.log(`⚠️  SectionBadgeVisibility   : Tabela não existe no schema`);
    }

    try {
      const realtimeCount = await (prisma as any).realtimeSettings.count();
      console.log(`✅ RealtimeSettings         : ${realtimeCount} registros`);
    } catch (e) {
      console.log(`⚠️  RealtimeSettings         : Tabela não existe no schema`);
    }

    try {
      const metricsCount = await (prisma as any).entity_view_metrics.count();
      console.log(`✅ entity_view_metrics      : ${metricsCount} registros`);
    } catch (e) {
      console.log(`⚠️  entity_view_metrics      : Tabela não existe no schema`);
    }

    try {
      const auditConfigsCount = await (prisma as any).audit_configs.count();
      console.log(`✅ audit_configs            : ${auditConfigsCount} registros`);
    } catch (e) {
      console.log(`⚠️  audit_configs            : Tabela não existe no schema`);
    }

    console.log('\n===========================================');
    console.log('✅ VERIFICAÇÃO CONCLUÍDA!\n');

  } catch (error) {
    console.error('❌ Erro durante verificação:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyNewTables();
