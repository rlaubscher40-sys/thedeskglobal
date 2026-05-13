CREATE TABLE `conversation_tracker` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`editionId` int,
	`lineText` text NOT NULL,
	`usedWithCategory` varchar(128),
	`usedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversation_tracker_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `daily_feed_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`feedDate` varchar(10) NOT NULL,
	`title` varchar(512) NOT NULL,
	`source` varchar(256) NOT NULL,
	`sourceUrl` text,
	`summary` text NOT NULL,
	`category` varchar(64) NOT NULL,
	`partnerTag` varchar(128),
	`promotedToEdition` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `daily_feed_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `editions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`editionNumber` int NOT NULL,
	`weekOf` varchar(64) NOT NULL,
	`weekRange` varchar(128) NOT NULL,
	`publishedAt` timestamp NOT NULL DEFAULT (now()),
	`pdfUrl` text NOT NULL,
	`readingTime` varchar(32),
	`topics` json NOT NULL,
	`signals` json NOT NULL,
	`fullText` text,
	`keyMetrics` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `editions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reading_queue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`feedItemId` int,
	`customUrl` text,
	`customTitle` varchar(512),
	`articleText` text,
	`isRead` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reading_queue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weekly_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`weekId` varchar(16) NOT NULL,
	`content` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `weekly_notes_id` PRIMARY KEY(`id`)
);
