CREATE TABLE `feed_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`feedDate` date NOT NULL,
	`title` varchar(200) NOT NULL,
	`source` varchar(200),
	`sourceUrl` text,
	`summary` text NOT NULL,
	`category` varchar(20) NOT NULL,
	`partnerTag` text,
	`sayThis` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feed_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ingestion_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`feedType` varchar(20) NOT NULL,
	`itemCount` int NOT NULL,
	`status` varchar(20) NOT NULL,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ingestion_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weekly_editions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`editionNumber` int NOT NULL,
	`weekOf` varchar(50) NOT NULL,
	`weekRange` varchar(100),
	`readingTime` varchar(30),
	`topics` json,
	`signals` json,
	`keyMetrics` json,
	`fullText` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `weekly_editions_id` PRIMARY KEY(`id`),
	CONSTRAINT `weekly_editions_editionNumber_unique` UNIQUE(`editionNumber`)
);
