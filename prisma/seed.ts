// prisma/seed.ts
import { PrismaClient } from '../generated/prisma';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Iniciando seed do banco de dados...');

        // Primeiro, criar o plano
        console.log('Criando plano...');
        const plan = await prisma.plans.create({
            data: {
                id: 1, // Define o ID como 1
                name: 'Plano Básico',
                users: 5,
                connections: 2,
                queues: 3,
                value: 99,
                useSchedules: true,
                useCampaigns: true,
                useInternalChat: true,
                useExternalApi: false,
                useKanban: false,
                useOpenAi: false,
                useIntegrations: false
            }
        });

        console.log(`Plano criado com ID: ${plan.id}`);

        // Depois, criar a empresa
        console.log('Criando empresa de teste...');
        const company = await prisma.companies.create({
            data: {
                name: "Empresa 1",
                planId: 1,
                dueDate: "2093-03-14 04:00:00+01",
                createdAt: new Date(),
                updatedAt: new Date()
            },
        });

        console.log(`Empresa de teste criada com ID: ${company.id}`);

        // Agora, criar um usuário para essa empresa
        console.log('Criando usuário admin...');
        const passwordHash = await hash('123456', 12);
        const user = await prisma.users.create({
            data: {
                name: 'Usuário Teste',
                email: 'teste@example.com',
                passwordHash,
                profile: 'admin',
                super: true,
                companyId: company.id
            }
        });

        console.log(`Usuário admin criado com ID: ${user.id}`);

        // Create Default Settings
        const settings = await prisma.settings.create({
            data: {

                key: "chatBotType, sendGreetingAccepted, sendMsgTransfTicket, userRating, scheduleType, CheckMsgIsGroup, call, ipixc, tokenixc, ipmkauth, clientidmkauth, clientsecretmkauth, asaas",
                value: "text, disabled, disabled, disabled, queue, enabled, disabled, , , , , ",
                companyId: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });
        console.log(`Seetings criado com sucesso! ${settings}`);

        console.log('Seed concluído com sucesso!');
    } catch (error) {
        console.error('Erro durante o seed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });