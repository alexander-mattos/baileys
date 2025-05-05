// types/index.ts
export interface User {
    id: number;
    name: string;
    email: string;
    passwordHash: string;
    tokenVersion: number;
    profile: string;
    super: boolean;
    online: boolean;
    createdAt: Date;
    updatedAt: Date;
    companyId: number;
    company: Company;
    tickets: Ticket[];
    queues: Queue[];
    quickMessages: QuickMessage[];
    whatsappId?: number;
    whatsapp?: Whatsapp;
    schedules: Schedule[];
    UserRating: UserRating[];
    TicketTraking: TicketTraking[];
    Chat: Chat[];
    ChatUser: ChatUser[];
    ChatMessage: ChatMessage[];
    TicketNote: TicketNote[];
    UserQueue: UserQueue[];
}

export interface Company {
    id: number;
    name: string;
    phone: string;
    email: string;
    status: boolean;
    dueDate: string;
    recurrence: string;
    planId: number;
    plan: Plan;
    createdAt: Date;
    updatedAt: Date;
    users: User[];
    userRatings: UserRating[];
    queues: Queue[];
    whatsapps: Whatsapp[];
    messages: Message[];
    contacts: Contact[];
    settings: Setting[];
    tickets: Ticket[];
    ticketTrakings: TicketTraking[];
    schedules: Schedule[];
    prompts: Prompt[];
    QuickMessage: QuickMessage[];
    QueueIntegrations: QueueIntegrations[];
    Tag: Tag[];
    ContactList: ContactList[];
    Announcement: Announcement[];
    Chat: Chat[];
    CampaignSetting: CampaignSetting[];
    Campaign: Campaign[];
    Files: Files[];
}

export interface Prompt {
    id: number;
    name: string;
    prompt: string;
    apiKey: string;
    maxMessages: number;
    maxTokens: number;
    temperature: number;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    voice: string;
    voiceKey?: string;
    voiceRegion?: string;
    queueId?: number;
    queue?: Queue;
    companyId: number;
    company: Company;
    createdAt: Date;
    updatedAt: Date;
    tickets: Ticket[];
    whatsapps: Whatsapp[];
}

export interface Queue {
    id: number;
    name: string;
    color: string;
    greetingMessage: string;
    outOfHoursMessage: string;
    schedules: any; // Json
    createdAt: Date;
    updatedAt: Date;
    companyId: number;
    company: Company;
    orderQueue: number;
    integrationId: number;
    promptId: number;
    whatsapps: Whatsapp[];
    users: User[];
    options: QueueOption[];
    queueIntegrations: QueueIntegrations;
    prompt: Prompt[];
    Ticket: Ticket[];
    Message: Message[];
    WhatsappQueue: WhatsappQueue[];
    UserQueue: UserQueue[];
}

export interface Ticket {
    id: number;
    status: string;
    unreadMessages: number;
    lastMessage: string;
    isGroup: boolean;
    createdAt: Date;
    updatedAt: Date;
    userId: number;
    user: User;
    contactId: number;
    contact: Contact;
    whatsappId: number;
    whatsapp: Whatsapp;
    queueId: number;
    queue: Queue;
    chatbot: boolean;
    queueOptionId: number;
    queueOption: QueueOption;
    messages: Message[];
    ticketTags: TicketTag[];
    tags: Tag[];
    companyId: number;
    company: Company;
    uuid: string;
    useIntegration: boolean;
    integrationId: number;
    queueIntegration: QueueIntegrations;
    typebotSessionId: string;
    typebotStatus: boolean;
    promptId: number;
    prompt: Prompt;
    fromMe: boolean;
    amountUsedBotQueues: number;
    schedules: Schedule[];
    userRatings: UserRating[];
    TicketTraking: TicketTraking[];
    Tag: Tag[];
    TicketNote: TicketNote[];
}

export interface QuickMessage {
    id: number;
    shortcode: string;
    message: string;
    companyId: number;
    userId: number;
    company: Company;
    user: User;
    createdAt: Date;
    updatedAt: Date;
    mediaPath?: string;
    mediaName?: string;
}

export interface Whatsapp {
    id: number;
    name?: string;
    session: string;
    qrcode: string;
    status: string;
    battery: string;
    plugged: boolean;
    retries: number;
    greetingMessage: string;
    farewellMessage: string;
    completionMessage: string;
    outOfHoursMessage: string;
    ratingMessage: string;
    provider: string;
    isDefault?: boolean;
    createdAt: Date;
    updatedAt: Date;
    companyId: number;
    company: Company;
    token: string;
    transferQueueId: number;
    timeToTransfer: number;
    promptId?: number;
    prompt?: Prompt;
    integrationId: number;
    queueIntegrations: QueueIntegrations;
    maxUseBotQueues: number;
    timeUseBotQueues: string;
    expiresTicket: number;
    expiresInactiveMessage: string;
    users: User[];
    contacts: Contact[];
    tickets: Ticket[];
    queues: Queue[];
    whatsappQueues: WhatsappQueue[];
    TicketTraking: TicketTraking[];
    Baileys: Baileys[];
    Campaign: Campaign[];
    BaileysChats: BaileysChats[];
}

export interface Message {
    id: string;
    remoteJid: string;
    participant: string;
    dataJson: string;
    ack: number;
    read: boolean;
    fromMe: boolean;
    body: string;
    mediaUrl?: string;
    mediaType: string;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    quotedMsgId?: string;
    quotedMsg?: Message;
    ticketId: number;
    ticket: Ticket;
    contactId: number;
    contact: Contact;
    companyId: number;
    company: Company;
    queueId: number;
    queue: Queue;
    isEdited: boolean;
    quotedMessages: Message[];
}

export type CampaignStatus =
    | "INATIVA"
    | "PROGRAMADA"
    | "EM_ANDAMENTO"
    | "CANCELADA"
    | "FINALIZADA";

export interface Campaign {
    id: number;
    name: string;
    message1: string;
    message2: string;
    message3: string;
    message4: string;
    message5: string;
    confirmationMessage1: string;
    confirmationMessage2: string;
    confirmationMessage3: string;
    confirmationMessage4: string;
    confirmationMessage5: string;
    status: CampaignStatus;
    confirmation: boolean;
    mediaPath: string;
    mediaName: string;
    scheduledAt: Date;
    completedAt: Date;
    createdAt: Date;
    updatedAt: Date;
    companyId: number;
    company: Company;
    contactListId: number;
    contactList: ContactList;
    whatsappId: number;
    whatsapp: Whatsapp;
    fileListId: number;
    fileList: Files;
    shipping: CampaignShipping[];
}

export interface UserRating {
    id: number;
    ticketId: number;
    ticket: Ticket;
    companyId: number;
    company: Company;
    userId: number;
    user: User;
    rate: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface TicketTraking {
    id: number;
    ticketId: number;
    ticket: Ticket;
    companyId: number;
    company: Company;
    whatsappId: number;
    whatsapp: Whatsapp;
    userId: number;
    rated: boolean;
    user: User;
    createdAt: Date;
    updatedAt: Date;
    startedAt: Date;
    queuedAt: Date;
    finishedAt: Date;
    ratingAt: Date;
    chatbotAt: Date;
}

export interface Setting {
    id: number;
    key: string;
    value: string;
    createdAt: Date;
    updatedAt: Date;
    companyId: number;
    company: Company;
}

export interface Contact {
    id: number;
    name: string;
    number: string;
    email: string;
    profilePicUrl: string;
    isGroup: boolean;
    createdAt: Date;
    updatedAt: Date;
    companyId: number;
    company: Company;
    whatsappId: number;
    whatsapp: Whatsapp;
    tickets: Ticket[];
    customFields: ContactCustomField[];
    schedules: Schedule[];
    Message: Message[];
    TicketNote: TicketNote[];
}

export interface Plan {
    id: number;
    name: string;
    users: number;
    connections: number;
    queues: number;
    value: number;
    createdAt: Date;
    updatedAt: Date;
    useSchedules: boolean;
    useCampaigns: boolean;
    useInternalChat: boolean;
    useExternalApi: boolean;
    useKanban: boolean;
    useOpenAi: boolean;
    useIntegrations: boolean;
    companies: Company[];
}

export interface QueueIntegrations {
    id: number;
    type: string;
    name: string;
    projectName: string;
    jsonContent: string;
    urlN8N: string;
    language: string;
    createdAt: Date;
    updatedAt: Date;
    companyId: number;
    company: Company;
    typebotSlug: string;
    typebotExpires: number;
    typebotKeywordFinish: string;
    typebotUnknownMessage: string;
    typebotDelayMessage: number;
    typebotKeywordRestart: string;
    typebotRestartMessage: string;
    queues: Queue[];
    tickets: Ticket[];
    whatsapps: Whatsapp[];
}

export interface QueueOption {
    id: number;
    title: string;
    message?: string;
    option?: string;
    queueId: number;
    parentId?: number;
    createdAt: Date;
    updatedAt: Date;
    queue: Queue;
    parent?: QueueOption;
    children: QueueOption[];
    tickets: Ticket[];
}

export interface Tag {
    id: number;
    name: string;
    color: string;
    companyId: number;
    company: Company;
    createdAt: Date;
    updatedAt: Date;
    kanban: number;
    ticketId?: number;
    tickets: Ticket[];
    ticketTags: TicketTag[];
    Ticket?: Ticket;
}

export interface TicketTag {
    ticketId: number;
    tagId: number;
    createdAt: Date;
    updatedAt: Date;
    ticket: Ticket;
    tag: Tag;
}

export interface WhatsappQueue {
    whatsappId: number;
    queueId: number;
    createdAt: Date;
    updatedAt: Date;
    whatsapp: Whatsapp;
    queue: Queue;
}

export interface ContactCustomField {
    id: number;
    name: string;
    value: string;
    contactId: number;
    contact: Contact;
    createdAt: Date;
    updatedAt: Date;
}

export interface Schedule {
    id: number;
    body: string;
    sendAt: Date;
    sentAt?: Date;
    contactId: number;
    ticketId: number;
    userId: number;
    companyId: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    mediaPath?: string;
    mediaName?: string;
    contact: Contact;
    ticket: Ticket;
    user: User;
    company: Company;
}

export interface ContactList {
    id: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    companyId: number;
    company: Company;
    items: ContactListItem[];
    Campaign: Campaign[];
}

export interface ContactListItem {
    id: number;
    contactListId: number;
    contactList: ContactList;
    CampaignShipping: CampaignShipping[];
}

export interface Announcement {
    id: number;
    priority: number;
    title: string;
    text: string;
    mediaPath: string;
    mediaName: string;
    companyId: number;
    company: Company;
    status: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Chat {
    id: number;
    uuid: string;
    title: string;
    ownerId: number;
    owner: User;
    lastMessage: string;
    companyId: number;
    company: Company;
    createdAt: Date;
    updatedAt: Date;
    users: ChatUser[];
    messages: ChatMessage[];
}

export interface ChatUser {
    id: number;
    chatId: number;
    chat: Chat;
    userId: number;
    user: User;
    unreads: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ChatMessage {
    id: number;
    chatId: number;
    chat: Chat;
    senderId: number;
    sender: User;
    message: string;
    mediaPath: string;
    mediaName: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Baileys {
    id: number;
    contacts?: string;
    chats?: string;
    createdAt: Date;
    updatedAt: Date;
    whatsappId: number;
    whatsapp: Whatsapp;
}

export interface CampaignShipping {
    id: number;
    jobId: string;
    number: string;
    message: string;
    confirmationMessage: string;
    confirmation: boolean;
    contactId: number;
    contact: ContactListItem;
    campaignId: number;
    campaign: Campaign;
    confirmationRequestedAt: Date;
    confirmedAt: Date;
    deliveredAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface CampaignSetting {
    id: number;
    key: string;
    value: string;
    companyId: number;
    company: Company;
    createdAt: Date;
    updatedAt: Date;
}

export interface BaileysChats {
    id: number;
    jid: string;
    conversationTimestamp: number;
    unreadCount: number;
    createdAt: Date;
    updatedAt: Date;
    whatsappId: number;
    whatsapp: Whatsapp;
}

export interface Files {
    id: number;
    name: string;
    message: string;
    companyId: number;
    company: Company;
    options: FilesOptions[];
    createdAt: Date;
    updatedAt: Date;
    Campaign: Campaign[];
}

export interface FilesOptions {
    id: number;
    name: string;
    path: string;
    mediaType: string;
    fileId: number;
    file: Files;
    createdAt: Date;
    updatedAt: Date;
}

export interface Help {
    id: number;
    title: string;
    description: string;
    video: string;
    link: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Invoices {
    id: number;
    detail: string;
    status: string;
    value: number;
    dueDate: string;
    companyId: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface Subscriptions {
    id: number;
    isActive: boolean;
    userPriceCents?: number;
    whatsPriceCents?: number;
    lastInvoiceUrl?: string;
    lastPlanChange?: Date;
    expiresAt?: Date;
    providerSubscriptionId?: string;
    companyId: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface TicketNote {
    id: number;
    note: string;
    userId: number;
    user: User;
    contactId: number;
    contact: Contact;
    ticketId: number;
    ticket: Ticket;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserQueue {
    userId: number;
    user: User;
    queueId: number;
    queue: Queue;
    createdAt: Date;
    updatedAt: Date;
}

// Tipos utilitários
export type Json = any; // Para campos JSON
export type WithRelations<T, K extends keyof T> = T & { [P in K]: T[P] };