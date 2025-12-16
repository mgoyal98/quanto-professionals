CREATE TABLE `companies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`profession` text,
	`pan` text,
	`gstin` text,
	`addressLine1` text,
	`addressLine2` text,
	`city` text NOT NULL,
	`pinCode` text NOT NULL,
	`state` text NOT NULL,
	`stateCode` text NOT NULL,
	`phone` text,
	`email` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`pan` text,
	`gstin` text,
	`phone` text,
	`email` text,
	`addressLine1` text,
	`addressLine2` text,
	`city` text NOT NULL,
	`pinCode` text,
	`state` text NOT NULL,
	`stateCode` text NOT NULL,
	`isArchived` integer DEFAULT false NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `discount_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text DEFAULT 'PERCENT' NOT NULL,
	`value` real NOT NULL,
	`description` text,
	`isDefault` integer DEFAULT false NOT NULL,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `invoice_series` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`prefix` text,
	`suffix` text,
	`startWith` integer DEFAULT 1 NOT NULL,
	`nextNumber` integer DEFAULT 1 NOT NULL,
	`isDefault` integer DEFAULT false NOT NULL,
	`isArchived` integer DEFAULT false NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tax_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`rate` real NOT NULL,
	`taxType` text DEFAULT 'GST' NOT NULL,
	`description` text,
	`isDefault` integer DEFAULT false NOT NULL,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`hsnCode` text,
	`rate` real DEFAULT 0 NOT NULL,
	`unit` text DEFAULT 'NOS' NOT NULL,
	`taxTemplateId` integer,
	`cessTemplateId` integer,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`taxTemplateId`) REFERENCES `tax_templates`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cessTemplateId`) REFERENCES `tax_templates`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `payment_methods` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`description` text,
	`instructions` text,
	`bankName` text,
	`accountNumber` text,
	`ifscCode` text,
	`accountHolder` text,
	`branchName` text,
	`upiId` text,
	`isDefault` integer DEFAULT false NOT NULL,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `invoice_formats` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`htmlTemplate` text NOT NULL,
	`cssStyles` text NOT NULL,
	`isDefault` integer DEFAULT false NOT NULL,
	`isActive` integer DEFAULT true NOT NULL,
	`isSystemTemplate` integer DEFAULT false NOT NULL,
	`paperSize` text DEFAULT 'A4' NOT NULL,
	`orientation` text DEFAULT 'portrait' NOT NULL,
	`marginTop` real DEFAULT 10 NOT NULL,
	`marginRight` real DEFAULT 10 NOT NULL,
	`marginBottom` real DEFAULT 10 NOT NULL,
	`marginLeft` real DEFAULT 10 NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoice_formats_name_unique` ON `invoice_formats` (`name`);--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoiceNumber` text NOT NULL,
	`invoiceSeriesId` integer NOT NULL,
	`customerId` integer NOT NULL,
	`invoiceFormatId` integer,
	`invoiceDate` integer NOT NULL,
	`dueDate` integer,
	`gstType` text DEFAULT 'INTRA' NOT NULL,
	`subTotal` real DEFAULT 0 NOT NULL,
	`totalItemDiscount` real DEFAULT 0 NOT NULL,
	`taxableTotal` real DEFAULT 0 NOT NULL,
	`totalCgst` real DEFAULT 0 NOT NULL,
	`totalSgst` real DEFAULT 0 NOT NULL,
	`totalIgst` real DEFAULT 0 NOT NULL,
	`totalCess` real DEFAULT 0 NOT NULL,
	`totalTax` real DEFAULT 0 NOT NULL,
	`additionalTaxTemplateId` integer,
	`additionalTaxName` text,
	`additionalTaxRate` real DEFAULT 0 NOT NULL,
	`additionalTaxAmount` real DEFAULT 0 NOT NULL,
	`discountType` text,
	`discountValue` real,
	`discountAmount` real DEFAULT 0 NOT NULL,
	`discountAfterTax` integer DEFAULT false NOT NULL,
	`grandTotal` real DEFAULT 0 NOT NULL,
	`paidAmount` real DEFAULT 0 NOT NULL,
	`dueAmount` real DEFAULT 0 NOT NULL,
	`paymentMethodId` integer,
	`notes` text,
	`status` text DEFAULT 'UNPAID' NOT NULL,
	`cancelReason` text,
	`reverseCharge` integer DEFAULT false NOT NULL,
	`isArchived` integer DEFAULT false NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`invoiceSeriesId`) REFERENCES `invoice_series`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`invoiceFormatId`) REFERENCES `invoice_formats`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`additionalTaxTemplateId`) REFERENCES `tax_templates`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`paymentMethodId`) REFERENCES `payment_methods`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_invoiceNumber_unique` ON `invoices` (`invoiceNumber`);--> statement-breakpoint
CREATE TABLE `invoice_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoiceId` integer NOT NULL,
	`itemId` integer,
	`name` text NOT NULL,
	`description` text,
	`hsnCode` text,
	`quantity` real DEFAULT 1 NOT NULL,
	`unit` text DEFAULT 'NOS' NOT NULL,
	`rate` real NOT NULL,
	`amount` real NOT NULL,
	`taxableAmount` real NOT NULL,
	`totalDiscount` real DEFAULT 0 NOT NULL,
	`totalTax` real DEFAULT 0 NOT NULL,
	`total` real NOT NULL,
	`sortOrder` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`invoiceId`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`itemId`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `invoice_item_taxes_discounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoiceItemId` integer NOT NULL,
	`taxTemplateId` integer,
	`discountTemplateId` integer,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`rate` real NOT NULL,
	`rateType` text DEFAULT 'PERCENT' NOT NULL,
	`taxableAmount` real NOT NULL,
	`amount` real NOT NULL,
	`sortOrder` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`invoiceItemId`) REFERENCES `invoice_items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`taxTemplateId`) REFERENCES `tax_templates`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`discountTemplateId`) REFERENCES `discount_templates`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `invoice_taxes_discounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoiceId` integer NOT NULL,
	`entryType` text NOT NULL,
	`taxTemplateId` integer,
	`discountTemplateId` integer,
	`name` text NOT NULL,
	`rateType` text DEFAULT 'PERCENT' NOT NULL,
	`rate` real NOT NULL,
	`applicationMode` text DEFAULT 'AFTER_TAX' NOT NULL,
	`baseAmount` real NOT NULL,
	`amount` real NOT NULL,
	`sortOrder` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`invoiceId`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`taxTemplateId`) REFERENCES `tax_templates`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`discountTemplateId`) REFERENCES `discount_templates`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `invoice_payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoiceId` integer NOT NULL,
	`paymentMethodId` integer,
	`amount` real NOT NULL,
	`paymentDate` integer NOT NULL,
	`referenceNumber` text,
	`notes` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`invoiceId`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`paymentMethodId`) REFERENCES `payment_methods`(`id`) ON UPDATE no action ON DELETE no action
);
