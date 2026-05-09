/*
 Navicat Premium Dump SQL

 Source Server         : Byg Dev Legacy
 Source Server Type    : SQLite
 Source Server Version : 3045000 (3.45.0)
 Source Schema         : main

 Target Server Type    : SQLite
 Target Server Version : 3045000 (3.45.0)
 File Encoding         : 65001

 Date: 09/05/2026 14:42:47
*/

PRAGMA foreign_keys = false;

-- ----------------------------
-- Table structure for __drizzle_migrations
-- ----------------------------
DROP TABLE IF EXISTS "__drizzle_migrations";
CREATE TABLE "__drizzle_migrations" (
				id SERIAL PRIMARY KEY,
				hash text NOT NULL,
				created_at numeric
			);

-- ----------------------------
-- Records of __drizzle_migrations
-- ----------------------------
BEGIN;
INSERT INTO "__drizzle_migrations" ("id", "hash", "created_at") VALUES (NULL, '91d77328209c6bca97f7ed9414c6cfb74c3264ea1896caa549aa03db9765751f', 1768500631771);
COMMIT;

-- ----------------------------
-- Table structure for followings
-- ----------------------------
DROP TABLE IF EXISTS "followings";
CREATE TABLE `followings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`follower_id` integer NOT NULL,
	`following_id` integer NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	FOREIGN KEY (`follower_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`following_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

-- ----------------------------
-- Records of followings
-- ----------------------------
BEGIN;
INSERT INTO "followings" ("id", "follower_id", "following_id", "created_at") VALUES (1, 7, 6, 1770893492000);
INSERT INTO "followings" ("id", "follower_id", "following_id", "created_at") VALUES (2, 7, 5, 1770895491000);
INSERT INTO "followings" ("id", "follower_id", "following_id", "created_at") VALUES (7, 6, 7, 1772912795000);
INSERT INTO "followings" ("id", "follower_id", "following_id", "created_at") VALUES (8, 7, 3, 1776313258000);
INSERT INTO "followings" ("id", "follower_id", "following_id", "created_at") VALUES (9, 7, 1, 1776313265000);
COMMIT;

-- ----------------------------
-- Table structure for image_comments
-- ----------------------------
DROP TABLE IF EXISTS "image_comments";
CREATE TABLE "image_comments" (
    "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    "image_id" integer NOT NULL REFERENCES "images"("id") ON DELETE cascade,
    "author_id" integer NOT NULL REFERENCES "users"("id") ON DELETE cascade,
    "content" text NOT NULL,
    "created_at" integer DEFAULT (strftime('%s','now') * 1000) NOT NULL
);

-- ----------------------------
-- Records of image_comments
-- ----------------------------
BEGIN;
INSERT INTO "image_comments" ("id", "image_id", "author_id", "content", "created_at") VALUES (1, 1, 7, 'test comment', 1769620491000);
INSERT INTO "image_comments" ("id", "image_id", "author_id", "content", "created_at") VALUES (2, 11, 7, 'test', 1769624191000);
INSERT INTO "image_comments" ("id", "image_id", "author_id", "content", "created_at") VALUES (3, 12, 7, 'cutee!', 1769624258000);
COMMIT;

-- ----------------------------
-- Table structure for images
-- ----------------------------
DROP TABLE IF EXISTS "images";
CREATE TABLE `images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`image_url` text NOT NULL,
	`author_id` integer NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	`likes` integer DEFAULT 0 NOT NULL,
	`shares` integer DEFAULT 0 NOT NULL, "comment_count" integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

-- ----------------------------
-- Records of images
-- ----------------------------
BEGIN;
INSERT INTO "images" ("id", "title", "image_url", "author_id", "created_at", "likes", "shares", "comment_count") VALUES (1, 'Vite Logo', 'https://vite.dev/logo.svg', 7, 1768503732031, 1, 1, 1);
INSERT INTO "images" ("id", "title", "image_url", "author_id", "created_at", "likes", "shares", "comment_count") VALUES (2, 'Vite Logo', 'https://vite.dev/logo.svg', 7, 1768503811471, 0, 1, 0);
INSERT INTO "images" ("id", "title", "image_url", "author_id", "created_at", "likes", "shares", "comment_count") VALUES (3, 'Vite Logo', 'https://vite.dev/logo.svg', 7, 1768590760192, 0, 2, 0);
INSERT INTO "images" ("id", "title", "image_url", "author_id", "created_at", "likes", "shares", "comment_count") VALUES (4, 'Vite Logo', 'https://vite.dev/logo.svg', 7, 1768590762672, 1, 0, 0);
INSERT INTO "images" ("id", "title", "image_url", "author_id", "created_at", "likes", "shares", "comment_count") VALUES (5, 'Vite Logo', 'https://vite.dev/logo.svg', 7, 1768590763018, 0, 0, 0);
INSERT INTO "images" ("id", "title", "image_url", "author_id", "created_at", "likes", "shares", "comment_count") VALUES (6, 'Vite Logo', 'https://vite.dev/logo.svg', 7, 1768590763183, 0, 0, 0);
INSERT INTO "images" ("id", "title", "image_url", "author_id", "created_at", "likes", "shares", "comment_count") VALUES (7, 'Vite Logo', 'https://vite.dev/logo.svg', 7, 1768590763364, 1, 0, 0);
INSERT INTO "images" ("id", "title", "image_url", "author_id", "created_at", "likes", "shares", "comment_count") VALUES (8, 'Vite Logo', 'https://vite.dev/logo.svg', 7, 1768590763602, 1, 5, 0);
INSERT INTO "images" ("id", "title", "image_url", "author_id", "created_at", "likes", "shares", "comment_count") VALUES (9, 'ljklkj', 'lkjlkj', 7, 1769443941997, 0, 0, 0);
INSERT INTO "images" ("id", "title", "image_url", "author_id", "created_at", "likes", "shares", "comment_count") VALUES (10, 'lkjlkj', 'https://a35.dev/Images/avatar.webp', 7, 1769445002571, 0, 0, 0);
INSERT INTO "images" ("id", "title", "image_url", "author_id", "created_at", "likes", "shares", "comment_count") VALUES (11, 'lkjlkj', 'lkjlkj', 7, 1769445059256, 0, 0, 1);
INSERT INTO "images" ("id", "title", "image_url", "author_id", "created_at", "likes", "shares", "comment_count") VALUES (12, 'test', 'https://a35.dev/images/avatar-26.webp', 7, 1769531628953, 73838378, 783834736, 1);
INSERT INTO "images" ("id", "title", "image_url", "author_id", "created_at", "likes", "shares", "comment_count") VALUES (13, '', 'https://c.files.bbci.co.uk/DDE2/production/_128320865_bbcmp_gabon.png', 7, 1773505190158, 0, 0, 0);
INSERT INTO "images" ("id", "title", "image_url", "author_id", "created_at", "likes", "shares", "comment_count") VALUES (14, 'asdf', 'asdf', 7, 1776238685667, 0, 0, 0);
COMMIT;

-- ----------------------------
-- Table structure for messages
-- ----------------------------
DROP TABLE IF EXISTS "messages";
CREATE TABLE `messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sender_id` integer NOT NULL,
	`recipient_id` integer NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`shared_post_id` integer,
	`shared_image_id` integer,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recipient_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`shared_post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`shared_image_id`) REFERENCES `images`(`id`) ON UPDATE no action ON DELETE set null
);

-- ----------------------------
-- Records of messages
-- ----------------------------
BEGIN;
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (1, 7, 6, 'hello', NULL, NULL, 1773039674572);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (2, 6, 7, 'hai', NULL, NULL, 1773039702686);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (3, 7, 6, 'how are you', NULL, NULL, 1773039714034);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (4, 6, 7, 'this feature is amazing', NULL, NULL, 1773039738067);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (5, 7, 6, '', 10, NULL, 1773039807521);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (6, 6, 7, '', NULL, 12, 1773039832163);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (7, 7, 6, 'indeed', NULL, NULL, 1773040448284);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (8, 6, 7, 'very cutie patootie', NULL, NULL, 1773040460306);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (9, 7, 6, 'hehe', NULL, NULL, 1773040715098);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (10, 7, 6, 'hello', NULL, NULL, 1773040898492);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (11, 7, 6, 'hello', NULL, NULL, 1773040903395);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (12, 7, 6, 'are you in this family', NULL, NULL, 1773040907577);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (13, 7, 6, 'who is this human', NULL, NULL, 1773040912359);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (14, 6, 7, '', NULL, 8, 1773040944471);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (15, 6, 7, 'isn''t this a masterpiece', NULL, NULL, 1773040951777);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (16, 7, 6, 'hello', NULL, NULL, 1773045514056);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (17, 6, 7, 'how are you', NULL, NULL, 1773045523561);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (18, 7, 6, '', 9, NULL, 1773045539926);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (19, 7, 6, '', NULL, 12, 1773045556953);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (20, 6, 7, 'it workss', NULL, NULL, 1773045564356);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (21, 6, 5, 'hai', NULL, NULL, 1773045666685);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (22, 6, 7, 'are you chezhen', NULL, NULL, 1773045949628);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (23, 7, 6, 'nooo', NULL, NULL, 1773045963587);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (24, 7, 6, '', NULL, 2, 1773045969126);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (25, 7, 6, '', NULL, 3, 1773045975840);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (26, 7, 6, '', NULL, 3, 1773045977513);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (27, 6, 7, 'hahehehhe', NULL, NULL, 1773045989155);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (28, 7, 6, 'i am going to ~~kill~~ i mean kiss you', NULL, NULL, 1773046483972);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (29, 7, 2, 'hai', NULL, NULL, 1773047122604);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (30, 7, 8, 'hai', NULL, NULL, 1773047138556);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (31, 7, 8, 'hai', NULL, NULL, 1773047141933);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (32, 7, 8, 'hai', NULL, NULL, 1773047143249);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (33, 7, 8, 'hai', NULL, NULL, 1773047144715);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (34, 7, 8, 'hai', NULL, NULL, 1773047146097);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (35, 7, 8, 'hai', NULL, NULL, 1773047147910);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (36, 7, 8, 'hai', NULL, NULL, 1773047149384);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (37, 7, 8, 'hai', NULL, NULL, 1773047150945);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (38, 7, 8, 'hai', NULL, NULL, 1773047152275);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (39, 7, 8, 'hai', NULL, NULL, 1773047154754);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (40, 7, 6, '', 9, NULL, 1773047556997);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (41, 7, 8, 'hai', NULL, NULL, 1773049696947);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (42, 7, 2, 'hello', NULL, NULL, 1773054229682);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (43, 7, 8, 'hai', NULL, NULL, 1773054270248);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (44, 7, 1, 'ur the og fr', NULL, NULL, 1773068101667);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (45, 7, 8, 'helo', NULL, NULL, 1773068133581);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (46, 7, 1, 'are you the original gangsta', NULL, NULL, 1773068146380);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (47, 7, 1, '?', NULL, NULL, 1773068149517);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (48, 7, 1, '😚', NULL, NULL, 1773068156624);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (49, 7, 6, 'yo where''d u go', NULL, NULL, 1773070704791);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (50, 6, 7, 'hai kitty', NULL, NULL, 1773070713659);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (51, 7, 6, 'are u cutie patootie', NULL, NULL, 1773071754776);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (52, 7, 6, 'hai hai hai hai hai flkajsldfjlasjkdflaskjdflsdfkjasd flaskjd flsdkjfas dfljks dlfksjd flskajdf laskdjflasjkdf laskdjf alsdkfj asldkjf asldjf alskdjf asljkdf lasdkj lk', NULL, NULL, 1773073372829);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (53, 7, 3, 'haii', NULL, NULL, 1773074641266);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (54, 7, 6, 'did you know: ur a cutie pie', NULL, NULL, 1773074656413);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (55, 7, 6, 'yes i did know that', NULL, NULL, 1773233996533);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (56, 6, 7, 'no u told me that', NULL, NULL, 1773234003411);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (57, 7, 6, 'oh im silly', NULL, NULL, 1773234015348);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (58, 6, 7, 'yes u are', NULL, NULL, 1773234029831);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (59, 6, 7, 'hehehehehehhehe', NULL, NULL, 1773234093573);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (60, 7, 6, 'mhm :3', NULL, NULL, 1773234101154);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (61, 6, 7, 'i love byg chat', NULL, NULL, 1773234109611);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (62, 7, 6, 'right? it''s literally the best way to rizz people', NULL, NULL, 1773234121852);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (63, 6, 7, 'right? like imagine using the best chat app ever?', NULL, NULL, 1773234132606);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (64, 7, 6, 'imagine not using Byg Chat', NULL, NULL, 1773234144836);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (65, 6, 7, 'i couldn''t imagine that', NULL, NULL, 1773234150696);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (66, 7, 6, 'well good think u don''t have to bc byg chat exists!', NULL, NULL, 1773234233825);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (67, 6, 7, 'hmm... if only u could edit messages', NULL, NULL, 1773234257712);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (68, 7, 6, 'soon?', NULL, NULL, 1773234262521);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (69, 6, 7, 'soon.', NULL, NULL, 1773234269425);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (70, 7, 6, 'very soon.', NULL, NULL, 1773234274017);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (71, 6, 7, 'how exciting.', NULL, NULL, 1773234329132);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (72, 7, 6, 'right?', NULL, NULL, 1773234333502);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (73, 6, 7, 'now that''s what I call epic if u ask me', NULL, NULL, 1773234343043);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (74, 7, 6, 'not cool.', NULL, NULL, 1773234391841);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (75, 6, 7, 'what?', NULL, NULL, 1773234395469);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (76, 7, 6, 'no typing indicator?', NULL, NULL, 1773234400882);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (77, 6, 7, 'that should be fixed soon too!', NULL, NULL, 1773234407775);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (78, 6, 7, 'anyways look i can now send u long ass messages', NULL, NULL, 1773234417392);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (79, 6, 7, 'and they still render fine!', NULL, NULL, 1773234423437);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (80, 6, 7, 'like this!', NULL, NULL, 1773234427653);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (81, 6, 7, 'isn''t that amazing?', NULL, NULL, 1773234432170);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (82, 7, 6, 'yes', NULL, NULL, 1773234435526);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (83, 7, 6, 'it''s amazing', NULL, NULL, 1773234441499);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (84, 7, 6, 'are u even awake hellooo', NULL, NULL, 1773234708885);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (85, 6, 7, 'yes im awake sweetie', NULL, NULL, 1773234715336);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (86, 7, 6, 'good', NULL, NULL, 1773234719062);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (87, 6, 7, 'kjlkj', NULL, NULL, 1773235251045);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (88, 7, 6, 'lkjkjkj', NULL, NULL, 1773235264746);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (89, 7, 6, 'hai', NULL, NULL, 1773235480428);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (90, 7, 6, '😚', NULL, NULL, 1773239270580);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (91, 6, 7, 'hi sweetie', NULL, NULL, 1773244122319);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (92, 7, 6, 'hai', NULL, NULL, 1773244129129);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (93, 7, 6, 'congratulations', NULL, NULL, 1773244179113);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (94, 6, 7, 'indeed', NULL, NULL, 1773244479467);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (95, 7, 6, '![avatar](https://a35hie.me/images/avatar-26.webp)', NULL, NULL, 1773244750466);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (96, 7, 6, 'i love fullscreen byg chat', NULL, NULL, 1773246059086);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (97, 6, 7, 'Yass?', NULL, NULL, 1773246369705);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (98, 7, 6, '```ts', NULL, NULL, 1773259066942);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (99, 7, 6, '```ts

  import type { BygPost } from ''@bygnet/types''
  import { Icon } from ''@iconify/vue''
  import DOMPurify from ''dompurify''
  import { marked } from ''marked''
  import markedShiki from ''marked-shiki''
  import { codeToHtml } from ''shiki''
  import { nextTick, ref, watchEffect } from ''vue''

  marked.use(markedShiki({
    async highlight(code, lang) {
      return codeToHtml(code, {
        lang: lang || ''text'',
        theme: ''dracula''
      });
    }
  }))

  import HStack from ''@/components/layout/HStack.vue''
  import VStack from ''@/components/layout/VStack.vue''
  import LikeButton from ''@/components/posts/LikeButton.vue''
  import ReportButton from ''@/components/posts/ReportButton.vue''
  import ShareButton from ''@/components/posts/ShareButton.vue''
  import UsernameView from ''@/components/posts/UsernameView.vue''
  import { formatDate } from ''@/utils/formatters.ts''

  const props = defineProps<{
    post: BygPost
    detailMode?: boolean
  }>()
  defineEmits([ ''navigate'' ])

  const renderedContent = ref('''')
  const expanded = ref(false)
  const contentEl = ref<HTMLElement | null>(null)
  const isClippable = ref(false)

  watchEffect(async () => {
    const html = await marked.parse(props.post.content ?? '''')
    renderedContent.value = DOMPurify.sanitize(html)
    await nextTick()

    if (contentEl.value && !props.detailMode) {
      const el = contentEl.value

      // force clamp temporarily to measure overflow
      el.classList.add(''clipped'')

      await nextTick()

      isClippable.value = el.scrollHeight > el.clientHeight + 1

      // remove clamp if not needed
      if (!isClippable.value) {
        el.classList.remove(''clipped'')
      }
    }
  })
```', NULL, NULL, 1773259080779);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (100, 6, 7, 'hai', NULL, NULL, 1774029441957);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (101, 4, 5, 'hkj', NULL, NULL, 1775388890918);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (102, 7, 9, 'Sfsdf', NULL, NULL, 1775993126331);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (103, 7, 9, 'haii pookie', NULL, NULL, 1777210002156);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (104, 7, 9, 'what are u doing~', NULL, NULL, 1777210006073);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (105, 7, 6, 'hai', NULL, NULL, 1777210120567);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (106, 7, 6, 'haii', NULL, NULL, 1777998680995);
INSERT INTO "messages" ("id", "sender_id", "recipient_id", "content", "shared_post_id", "shared_image_id", "created_at") VALUES (107, 7, 6, 'what''s nine plus ten', NULL, NULL, 1777998684466);
COMMIT;

-- ----------------------------
-- Table structure for post_comments
-- ----------------------------
DROP TABLE IF EXISTS "post_comments";
CREATE TABLE "post_comments" (
    "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    "post_id" integer NOT NULL REFERENCES "posts"("id") ON DELETE cascade,
    "author_id" integer NOT NULL REFERENCES "users"("id") ON DELETE cascade,
     "content" text NOT NULL,
     "created_at" integer DEFAULT (strftime('%s','now') * 1000) NOT NULL
);

-- ----------------------------
-- Records of post_comments
-- ----------------------------
BEGIN;
INSERT INTO "post_comments" ("id", "post_id", "author_id", "content", "created_at") VALUES (1, 1, 7, 'test comment', 1769620464000);
INSERT INTO "post_comments" ("id", "post_id", "author_id", "content", "created_at") VALUES (2, 1, 7, 'lkjkl', 1769620587000);
INSERT INTO "post_comments" ("id", "post_id", "author_id", "content", "created_at") VALUES (3, 1, 7, 'I love comments', 1769620793000);
INSERT INTO "post_comments" ("id", "post_id", "author_id", "content", "created_at") VALUES (4, 1, 7, 'another test', 1769620807000);
INSERT INTO "post_comments" ("id", "post_id", "author_id", "content", "created_at") VALUES (5, 7, 7, 'this is sigma', 1769620931000);
INSERT INTO "post_comments" ("id", "post_id", "author_id", "content", "created_at") VALUES (6, 3, 7, 'awesome!', 1769621100000);
INSERT INTO "post_comments" ("id", "post_id", "author_id", "content", "created_at") VALUES (7, 8, 7, 'I love comments.', 1769621153000);
INSERT INTO "post_comments" ("id", "post_id", "author_id", "content", "created_at") VALUES (8, 11, 7, 'I love images', 1769624104000);
INSERT INTO "post_comments" ("id", "post_id", "author_id", "content", "created_at") VALUES (9, 8, 6, 'hai pookie', 1772914267000);
INSERT INTO "post_comments" ("id", "post_id", "author_id", "content", "created_at") VALUES (10, 7, 7, 'an IQ too high?', 1772960702000);
INSERT INTO "post_comments" ("id", "post_id", "author_id", "content", "created_at") VALUES (11, 8, 6, '@testers7@byg what is this', 1772961698000);
INSERT INTO "post_comments" ("id", "post_id", "author_id", "content", "created_at") VALUES (12, 8, 7, '@testers6@byg this is war', 1772962502000);
INSERT INTO "post_comments" ("id", "post_id", "author_id", "content", "created_at") VALUES (13, 8, 6, '@testers7@byg ur gonna die bit-', 1772962534000);
INSERT INTO "post_comments" ("id", "post_id", "author_id", "content", "created_at") VALUES (14, 8, 7, '@testers6@byg damn you', 1772962544000);
INSERT INTO "post_comments" ("id", "post_id", "author_id", "content", "created_at") VALUES (15, 8, 6, '@testers7@byg damn you!', 1772962568000);
INSERT INTO "post_comments" ("id", "post_id", "author_id", "content", "created_at") VALUES (16, 9, 7, 'this is a comment', 1773256615000);
INSERT INTO "post_comments" ("id", "post_id", "author_id", "content", "created_at") VALUES (17, 11, 7, '```ts
import { cute } from ''slay''
```', 1773259463000);
INSERT INTO "post_comments" ("id", "post_id", "author_id", "content", "created_at") VALUES (18, 22, 6, 'cute!', 1775143446000);
INSERT INTO "post_comments" ("id", "post_id", "author_id", "content", "created_at") VALUES (19, 22, 6, 'yass', 1775150903000);
INSERT INTO "post_comments" ("id", "post_id", "author_id", "content", "created_at") VALUES (20, 22, 6, 'dsfsdf', 1775151454000);
INSERT INTO "post_comments" ("id", "post_id", "author_id", "content", "created_at") VALUES (21, 22, 6, 'sdfsfa', 1775151466000);
INSERT INTO "post_comments" ("id", "post_id", "author_id", "content", "created_at") VALUES (22, 22, 6, 'dsfsdf', 1775151503000);
INSERT INTO "post_comments" ("id", "post_id", "author_id", "content", "created_at") VALUES (23, 22, 6, 'fasdfasd', 1775151543000);
INSERT INTO "post_comments" ("id", "post_id", "author_id", "content", "created_at") VALUES (24, 23, 6, '<iframe frameborder="0" allow="clipboard-write" style="border:none;width:614px;height:244px;" width="614" height="244" src="https://music.yandex.ru/iframe/album/12918329/track/69226955">Listen to <a href="https://music.yandex.ru/album/12918329/track/69226955?utm_source=web&utm_medium=copy_link">the 1</a> — <a href="https://music.yandex.ru/artist/4065">Taylor Swift</a> on Yandex Music</iframe>', 1776130659000);
INSERT INTO "post_comments" ("id", "post_id", "author_id", "content", "created_at") VALUES (25, 23, 6, 'https://music.yandex.ru/album/12918329/track/69226955', 1776130743000);
INSERT INTO "post_comments" ("id", "post_id", "author_id", "content", "created_at") VALUES (26, 23, 6, '<iframe frameborder="0" allow="clipboard-write" style="border:none;width:614px;height:244px;" width="614" height="244" src="https://music.yandex.ru/iframe/album/12918329/track/69226955">Listen to <a href="https://music.yandex.ru/album/12918329/track/69226955?utm_source=web&utm_medium=copy_link">the 1</a> — <a href="https://music.yandex.ru/artist/4065">Taylor Swift</a> on Yandex Music</iframe>', 1776131085000);
INSERT INTO "post_comments" ("id", "post_id", "author_id", "content", "created_at") VALUES (27, 23, 6, '<iframe frameborder="0" allow="clipboard-write" style="border:none;width:614px;height:244px;" width="614" height="244" src="https://music.yandex.ru/iframe/album/12918329/track/69226955">Listen to <a href="https://music.yandex.ru/album/12918329/track/69226955?utm_source=web&utm_medium=copy_link">the 1</a> — <a href="https://music.yandex.ru/artist/4065">Taylor Swift</a> on Yandex Music</iframe>', 1776131133000);
INSERT INTO "post_comments" ("id", "post_id", "author_id", "content", "created_at") VALUES (28, 23, 6, '<iframe frameborder="0" allow="clipboard-write" style="border:none;width:614px;height:244px;" width="614" height="244" src="https://music.yandex.ru/iframe/album/12918329/track/69226955">Listen to <a href="https://music.yandex.ru/album/12918329/track/69226955?utm_source=web&utm_medium=copy_link">the 1</a> — <a href="https://music.yandex.ru/artist/4065">Taylor Swift</a> on Yandex Music</iframe>', 1776131163000);
COMMIT;

-- ----------------------------
-- Table structure for posts
-- ----------------------------
DROP TABLE IF EXISTS "posts";
CREATE TABLE `posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`author_id` integer NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL,
	`likes` integer DEFAULT 0 NOT NULL,
	`shares` integer DEFAULT 0 NOT NULL, "comment_count" integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

-- ----------------------------
-- Records of posts
-- ----------------------------
BEGIN;
INSERT INTO "posts" ("id", "title", "content", "author_id", "created_at", "likes", "shares", "comment_count") VALUES (1, 'Happy Wednesday (again)!', '## Byg now supports Markdown!

**Have you ever wanted to express yourself with formatting?** 
Now you can.

### Headers galore...
You can:
- Make headers
- List your items (like this!)

and...
1. Be organized
2. Have fun
3. Enjoy Byg!

# Thanks for using Byg!

On behalf of the Byg team, we love you 🫶', 7, 1768503804357, 34893488, 9849978, 4);
INSERT INTO "posts" ("id", "title", "content", "author_id", "created_at", "likes", "shares", "comment_count") VALUES (3, 'Short pose', 'this is a short post.', 7, 1768754566042, 1, 0, 1);
INSERT INTO "posts" ("id", "title", "content", "author_id", "created_at", "likes", "shares", "comment_count") VALUES (4, 'lkjklj', 'lkjlkj', 7, 1769443829631, 15, 1, 0);
INSERT INTO "posts" ("id", "title", "content", "author_id", "created_at", "likes", "shares", "comment_count") VALUES (5, 'lkjlkjlkj', 'lkjlkjlkjljklkjlkjl;kjl;kjas;ldkfja;slzdkj;alszkdjf;ladkjfl;adjka;lszdkfja;sldkjfal;sdjf;alkjas;ldjkf;lasjk;alsdkjf;asldkjfas;ldkjfs;ldkjasf;lkj;asldkfj;lasdkjl;askdjl;askdjasl;djkfasl;dkjasl;dkjfals;dkja;sldkf;alsdkj;alskjas;ldfjka;lsdjk;lasdkjasl;dkjasdl;kjsl;dkjsl;dkfjsl;dkjfs;ldkfjsal;dkfjsl;djsal;dfjsl;djl;sajfs;lazjfl;sjl;asdjfl;asjf;lasjdf;asljf;lasjfsl;djfs;ldj;lsj;asldjksl;djf;slfjs;ldjfsl;dsl;dal;sdjal;sjal;skjal;skdjas;ldkjfa;lsdkjf;sladkjfasl;kdjf;lsdkjfasl;dkj;aslkdjasl;jsal;jl;sjasl;djksl;jls;akjslkjdlsj
sd
as
dfas
df
as
fs
d

s


sdf
asd
asd

sd
sad
as
a
s
sd
fasdfasd fikljasdlfksadkljsdflkasjdlksadl

- sdfklasj
- adlskjaslkjd
- sdlfkjasldjkf

## lkjslfjasljkf
l;sdkfjasl;jdfa;lsjkl;asjf
sdfjalsdkjfaslkd
asjfasdfjsadklfa
sdkjfas
dfas
jdfas
djfs
ajfsajdfsjdfskjskldjskldasd

dsjslajkfasldjfasljfklas
ssd
ljasdlaskjflsjsladjs
s
djlsjadlfksalkjaskld
d

sdfaskldlkasjdfjlksldk
s
sd

sfskldjsldjfsldkjfsd


sskldjfslkdjlksajdlksa
s
dsaldkfjaslkdjflsjlksdj

jdlskfjaslkdjfalskdjlsak', 7, 1769444095573, 5, 0, 0);
INSERT INTO "posts" ("id", "title", "content", "author_id", "created_at", "likes", "shares", "comment_count") VALUES (6, 'new post on web', 'byg web is awesome', 7, 1769444863601, 1, 0, 0);
INSERT INTO "posts" ("id", "title", "content", "author_id", "created_at", "likes", "shares", "comment_count") VALUES (7, 'lkj', 'lkjlkj', 7, 1769536667308, 2, 0, 2);
INSERT INTO "posts" ("id", "title", "content", "author_id", "created_at", "likes", "shares", "comment_count") VALUES (8, 'Comments come to Byg!', 'Finally!', 7, 1769621143895, 25, 0, 7);
INSERT INTO "posts" ("id", "title", "content", "author_id", "created_at", "likes", "shares", "comment_count") VALUES (9, 'hehe', '@testers7@byg is super cute', 6, 1772962611570, 2, 2, 1);
INSERT INTO "posts" ("id", "title", "content", "author_id", "created_at", "likes", "shares", "comment_count") VALUES (10, '😚😚', '💜🫶🥰', 7, 1772964707667, 0, 1, 0);
INSERT INTO "posts" ("id", "title", "content", "author_id", "created_at", "likes", "shares", "comment_count") VALUES (11, 'Code Block Test', '```ts
import { cute } from ''slay''
```', 7, 1773257606154, 1, 0, 1);
INSERT INTO "posts" ("id", "title", "content", "author_id", "created_at", "likes", "shares", "comment_count") VALUES (12, 'Code Test', '`code`', 7, 1773257668508, 0, 0, 0);
INSERT INTO "posts" ("id", "title", "content", "author_id", "created_at", "likes", "shares", "comment_count") VALUES (13, '', '```ts
  import type { BygPost } from ''@bygnet/types''
  import { Icon } from ''@iconify/vue''
  import DOMPurify from ''dompurify''
  import { marked } from ''marked''
  import markedShiki from ''marked-shiki''
  import { codeToHtml } from ''shiki''
  import { nextTick, ref, watchEffect } from ''vue''

  marked.use(markedShiki({
    async highlight(code, lang) {
      return codeToHtml(code, {
        lang: lang || ''text'',
        theme: ''dracula''
      });
    }
  }))

  import HStack from ''@/components/layout/HStack.vue''
  import VStack from ''@/components/layout/VStack.vue''
  import LikeButton from ''@/components/posts/LikeButton.vue''
  import ReportButton from ''@/components/posts/ReportButton.vue''
  import ShareButton from ''@/components/posts/ShareButton.vue''
  import UsernameView from ''@/components/posts/UsernameView.vue''
  import { formatDate } from ''@/utils/formatters.ts''

  const props = defineProps<{
    post: BygPost
    detailMode?: boolean
  }>()
  defineEmits([ ''navigate'' ])
```', 7, 1773258509249, 0, 0, 0);
INSERT INTO "posts" ("id", "title", "content", "author_id", "created_at", "likes", "shares", "comment_count") VALUES (14, 'Sass', '```sass
:root
  --headerFont: "Unbounded", "Fluent Emoji Color", sans-serif
  --globalFont: "Satoshi", "Fluent Emoji Color", system-ui, -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, Oxygen, Ubuntu, Cantarell, ''Open Sans'', ''Helvetica Neue'', sans-serif
  --codeFont: "JetBrains Mono", monospace

$global: var(--globalFont)
$header: var(--headerFont)
$code: var(--codeFont)

*
  font-family: $global
  white-space: pre-wrap
  word-break: break-word
  overflow-wrap: anywhere

p
  font-size: 105%
  letter-spacing: 0.5px
  margin: 0

h1, h2, h3, h4, h5, h6
  margin: 0.5rem 0 0.25rem

h1, h2, h3, h4, h5, h6
  font-family: $header
  font-weight: bold

code, code *
  font-family: $code

pre.shiki
  padding: 0.5rem
  border-radius: 0.75rem
```', 7, 1773258849627, 0, 0, 0);
INSERT INTO "posts" ("id", "title", "content", "author_id", "created_at", "likes", "shares", "comment_count") VALUES (15, 'Vue', '```vue
<script setup lang="ts">
  import { useAttrs } from ''vue''

  import {showingNavigation} from "@/data/visibility.ts";

  const attrs = useAttrs()

  defineProps<{
    hideTermsLink?: boolean
  }>()
</script>

<template>
  <div class="contentArea" v-bind="attrs" :class="{ expanded: !showingNavigation }">
    <div class="contentContainer">
      <slot />

      <p class="light termsLink" v-if="!hideTermsLink">
        To use this platform, you agree to the
        <RouterLink to="/terms" class="prominentLink">Terms of Service</RouterLink
        >.
      </p>
    </div>
  </div>
</template>

<style scoped lang="sass">
  .contentArea
    margin: var(--padding) 0
    width: 100%
    padding: 0 var(--padding)

    &:not(.expanded)
      max-width: 65rem

    .contentContainer
      width: 100%
      height: 100%
      min-height: 100vh

      .termsLink
        text-align: center
        margin-top: 1rem
</style>
```', 7, 1773260243700, 1, 0, 0);
INSERT INTO "posts" ("id", "title", "content", "author_id", "created_at", "likes", "shares", "comment_count") VALUES (16, 'HTML', '```html
<!doctype html>
<html lang="en-US">
  <head>
    <title>Byg Platform</title>

    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"
    />

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Unbounded:wght@200..900&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="https://geistfont.vercel.app/geist.css" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```', 7, 1773260321479, 0, 0, 0);
INSERT INTO "posts" ("id", "title", "content", "author_id", "created_at", "likes", "shares", "comment_count") VALUES (17, 'i bought a criossant', 'i wanted a criossant
-# criossant', 7, 1773422559946, 0, 0, 0);
INSERT INTO "posts" ("id", "title", "content", "author_id", "created_at", "likes", "shares", "comment_count") VALUES (18, '1', 'hai', 1, 1774895505000, 0, 0, 0);
INSERT INTO "posts" ("id", "title", "content", "author_id", "created_at", "likes", "shares", "comment_count") VALUES (19, '2', 'hai', 2, 1774895505000, 0, 0, 0);
INSERT INTO "posts" ("id", "title", "content", "author_id", "created_at", "likes", "shares", "comment_count") VALUES (20, '3', 'hai', 3, 1774895505000, 0, 0, 0);
INSERT INTO "posts" ("id", "title", "content", "author_id", "created_at", "likes", "shares", "comment_count") VALUES (21, '4', 'hai', 4, 1774895505000, 0, 0, 0);
INSERT INTO "posts" ("id", "title", "content", "author_id", "created_at", "likes", "shares", "comment_count") VALUES (22, 'kot', '![](https://www.boredpanda.com/blog/wp-content/uploads/2023/07/funny-cat-pics-and-memes-64a6d10212f29__700.jpg)', 6, 1774937478942, 0, 0, 6);
INSERT INTO "posts" ("id", "title", "content", "author_id", "created_at", "likes", "shares", "comment_count") VALUES (23, 'sdf', 'sdf', 6, 1775151634843, 8, 0, 5);
INSERT INTO "posts" ("id", "title", "content", "author_id", "created_at", "likes", "shares", "comment_count") VALUES (24, 'adsf', 'adsf', 7, 1776238587700, 1, 0, 0);
INSERT INTO "posts" ("id", "title", "content", "author_id", "created_at", "likes", "shares", "comment_count") VALUES (25, 'adsf', 'ads', 7, 1776238681617, 2, 0, 0);
INSERT INTO "posts" ("id", "title", "content", "author_id", "created_at", "likes", "shares", "comment_count") VALUES (26, 'test post', 'jlkj', 7, 1778004480377, 0, 0, 0);
INSERT INTO "posts" ("id", "title", "content", "author_id", "created_at", "likes", "shares", "comment_count") VALUES (27, '', '<p>kjljkljklkjlkj <em>jlkjlkjlkjjk </em>jklkjlk htj</p><p></p><h1>this is where <strong>things</strong> get crazy</h1><p>once you consider my <em><s>nipples</s></em></p><p></p>', 7, 1778236842246, 1, 0, 0);
INSERT INTO "posts" ("id", "title", "content", "author_id", "created_at", "likes", "shares", "comment_count") VALUES (28, 'lj', '*lkjlkjlkjlkj*', 7, 1778237367269, 0, 0, 0);
INSERT INTO "posts" ("id", "title", "content", "author_id", "created_at", "likes", "shares", "comment_count") VALUES (29, '', '***** ljlkj *****~~<strong>fjaslkdjflasdkjflasjkdflasjkd</strong>~~', 7, 1778237491509, 0, 0, 0);
INSERT INTO "posts" ("id", "title", "content", "author_id", "created_at", "likes", "shares", "comment_count") VALUES (30, '', '~~this is cool~~', 7, 1778237520934, 0, 0, 0);
INSERT INTO "posts" ("id", "title", "content", "author_id", "created_at", "likes", "shares", "comment_count") VALUES (31, 'This is an insane post', 'jlkjlkjlkj



# What''s up *bitchesssssssss*



did you know that you''re a cutie patootie?

', 7, 1778237614519, 0, 0, 0);
COMMIT;

-- ----------------------------
-- Table structure for sessions
-- ----------------------------
DROP TABLE IF EXISTS "sessions";
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

-- ----------------------------
-- Records of sessions
-- ----------------------------
BEGIN;
INSERT INTO "sessions" ("id", "user_id", "expires_at") VALUES ('e84e3452-2df8-4606-bae0-646740c6d8e9', 7, 1771094462931);
INSERT INTO "sessions" ("id", "user_id", "expires_at") VALUES ('9ffedd76-2af0-401a-be0b-965d49a2075b', 7, 1771094704935);
INSERT INTO "sessions" ("id", "user_id", "expires_at") VALUES ('2cf8b891-05e3-4402-b716-b98c28be1ca0', 7, 1771095566500);
INSERT INTO "sessions" ("id", "user_id", "expires_at") VALUES ('12960d99-3763-445d-b9a2-9f4d4d1b4b14', 7, 1771095618596);
INSERT INTO "sessions" ("id", "user_id", "expires_at") VALUES ('2672aaf5-fbd7-4927-811d-77c57993e203', 7, 1771095624358);
INSERT INTO "sessions" ("id", "user_id", "expires_at") VALUES ('8c4a536f-4631-4043-9b53-b156643f9b63', 7, 1771185315682);
INSERT INTO "sessions" ("id", "user_id", "expires_at") VALUES ('c76c832c-c680-4e0d-878b-f1bc212b57a2', 7, 1771243974518);
INSERT INTO "sessions" ("id", "user_id", "expires_at") VALUES ('d4e108d9-20cd-4c38-b000-fabfb3179f34', 8, 1771247885534);
INSERT INTO "sessions" ("id", "user_id", "expires_at") VALUES ('f0ea4d6d-990b-4413-b62e-cd3a2d9f9c28', 7, 1771248426898);
INSERT INTO "sessions" ("id", "user_id", "expires_at") VALUES ('c522c9c3-8f75-414b-9bd3-723ef1f50237', 7, 1771342179256);
INSERT INTO "sessions" ("id", "user_id", "expires_at") VALUES ('b29706bf-5ff8-48a7-8012-c85d701c176d', 7, 1772035415035);
INSERT INTO "sessions" ("id", "user_id", "expires_at") VALUES ('dd550cd1-4589-4b27-9b6c-6748a175da8d', 7, 1772208931092);
INSERT INTO "sessions" ("id", "user_id", "expires_at") VALUES ('0644391d-fcd3-4f59-8db5-e35a383cbce3', 7, 1773486440453);
INSERT INTO "sessions" ("id", "user_id", "expires_at") VALUES ('bac1af63-0df5-426d-bf88-19964c9ef181', 7, 1773487277005);
INSERT INTO "sessions" ("id", "user_id", "expires_at") VALUES ('b7091912-9389-495f-8c14-5e7196ed7a61', 7, 1775502997049);
INSERT INTO "sessions" ("id", "user_id", "expires_at") VALUES ('da0cbc28-b807-4fdb-b0d0-800ad6b27128', 6, 1775504276399);
INSERT INTO "sessions" ("id", "user_id", "expires_at") VALUES ('4a5d3b19-ac39-4f3a-82dd-61a39a42a680', 7, 1775553646831);
INSERT INTO "sessions" ("id", "user_id", "expires_at") VALUES ('06c0a71d-24f4-4d45-bbdd-1cc3586c2d0a', 7, 1775592918090);
INSERT INTO "sessions" ("id", "user_id", "expires_at") VALUES ('a6af8119-2a1a-4d9d-bf4e-ef46d2d60667', 7, 1775825952652);
INSERT INTO "sessions" ("id", "user_id", "expires_at") VALUES ('8945907a-12b9-44e8-afcc-6c77a069d60c', 6, 1775827449230);
INSERT INTO "sessions" ("id", "user_id", "expires_at") VALUES ('7a99e08e-3b37-4cbc-af84-39b9d394639e', 7, 1775829883249);
INSERT INTO "sessions" ("id", "user_id", "expires_at") VALUES ('6031bea6-a1b5-48df-8ab0-cf850080f82d', 7, 1775836110351);
INSERT INTO "sessions" ("id", "user_id", "expires_at") VALUES ('bd57160e-4abd-4c6c-b165-bd391e0e2d69', 6, 1775838137107);
INSERT INTO "sessions" ("id", "user_id", "expires_at") VALUES ('0b809cc3-d148-4fe2-83ee-0a3fb4d1d887', 7, 1776014533965);
INSERT INTO "sessions" ("id", "user_id", "expires_at") VALUES ('addfa873-5309-4a5d-aca1-0fca79a24951', 7, 1776100205371);
INSERT INTO "sessions" ("id", "user_id", "expires_at") VALUES ('82f5b7be-71bd-493c-a13d-3659ba42dc06', 7, 1776101514695);
INSERT INTO "sessions" ("id", "user_id", "expires_at") VALUES ('f443812f-f3ef-4f77-986f-317230449db4', 7, 1776183321267);
INSERT INTO "sessions" ("id", "user_id", "expires_at") VALUES ('a48e5229-2673-47dd-ab43-30e18a99996a', 6, 1776621364411);
INSERT INTO "sessions" ("id", "user_id", "expires_at") VALUES ('37f425bf-7d1e-4048-89ad-5e7f7e18c69c', 5, 1776621377984);
INSERT INTO "sessions" ("id", "user_id", "expires_at") VALUES ('89f81a5c-0a74-4639-b59d-4b285a64db5f', 7, 1776622545408);
INSERT INTO "sessions" ("id", "user_id", "expires_at") VALUES ('f4f5bc37-dfe8-40da-9ff2-24e11dd820fe', 7, 1776622730624);
INSERT INTO "sessions" ("id", "user_id", "expires_at") VALUES ('911312b4-8b1a-4270-80e3-af67563db598', 4, 1777743781947);
INSERT INTO "sessions" ("id", "user_id", "expires_at") VALUES ('6f6d6562-e886-4789-a6a5-8dce6d5c3ede', 6, 1778559757834);
INSERT INTO "sessions" ("id", "user_id", "expires_at") VALUES ('64880593-38e2-487a-a97b-89d9f8f9d27b', 7, 1778585087601);
INSERT INTO "sessions" ("id", "user_id", "expires_at") VALUES ('37db717c-f566-4322-9653-15fcad35a386', 7, 1778825061690);
INSERT INTO "sessions" ("id", "user_id", "expires_at") VALUES ('a69beee7-6cff-42b6-a1ff-49fa52e49112', 7, 1778845269092);
INSERT INTO "sessions" ("id", "user_id", "expires_at") VALUES ('c56baedd-1e82-4d3d-a9f9-82ed0dee28e9', 6, 1778908620431);
INSERT INTO "sessions" ("id", "user_id", "expires_at") VALUES ('1bd17810-0ea1-45e3-a0d0-50327010c478', 7, 1778920211058);
INSERT INTO "sessions" ("id", "user_id", "expires_at") VALUES ('ca452655-1c55-4d37-bd2e-38249ef52f82', 4, 1780837649614);
COMMIT;

-- ----------------------------
-- Table structure for short_links
-- ----------------------------
DROP TABLE IF EXISTS "short_links";
CREATE TABLE `short_links` (
	`slug` text PRIMARY KEY NOT NULL,
	`destination_url` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL
);

-- ----------------------------
-- Records of short_links
-- ----------------------------
BEGIN;
INSERT INTO "short_links" ("slug", "destination_url", "created_at") VALUES ('usHyzA3', 'https://a35.dev/', 1776712417000);
INSERT INTO "short_links" ("slug", "destination_url", "created_at") VALUES ('17yXRQj', 'https://gmail.com/', 1776712575000);
COMMIT;

-- ----------------------------
-- Table structure for sqlite_sequence
-- ----------------------------
DROP TABLE IF EXISTS "sqlite_sequence";
CREATE TABLE sqlite_sequence(name,seq);

-- ----------------------------
-- Records of sqlite_sequence
-- ----------------------------
BEGIN;
INSERT INTO "sqlite_sequence" ("name", "seq") VALUES ('users', 9);
INSERT INTO "sqlite_sequence" ("name", "seq") VALUES ('images', 14);
INSERT INTO "sqlite_sequence" ("name", "seq") VALUES ('posts', 31);
INSERT INTO "sqlite_sequence" ("name", "seq") VALUES ('post_comments', 28);
INSERT INTO "sqlite_sequence" ("name", "seq") VALUES ('image_comments', 3);
INSERT INTO "sqlite_sequence" ("name", "seq") VALUES ('followings', 9);
INSERT INTO "sqlite_sequence" ("name", "seq") VALUES ('messages', 107);
COMMIT;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS "users";
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`username` text NOT NULL,
	`pass_hash` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000) NOT NULL
, `bio` text, `avatar_url` text, `banner_url` text, `subscription_state` text DEFAULT 'plus_legacy', `verification` text, `color` text, email_verification_code text, "2fa_secret" text);

-- ----------------------------
-- Records of users
-- ----------------------------
BEGIN;
INSERT INTO "users" ("id", "email", "username", "pass_hash", "created_at", "bio", "avatar_url", "banner_url", "subscription_state", "verification", "color", "email_verification_code", "2fa_secret") VALUES (1, 'test@a35.dev', 'testers@byg', '$argon2id$v=19$m=65536,t=3,p=4$DvtpJBBpw8tY6+fn6sxWkw$SwyZRe3U4TVbZeR2WTl9H3GO4cRer2hGH1NNeFlSzQg', 1768501725000, NULL, NULL, NULL, 'plus_legacy', 'organization', NULL, '076002', NULL);
INSERT INTO "users" ("id", "email", "username", "pass_hash", "created_at", "bio", "avatar_url", "banner_url", "subscription_state", "verification", "color", "email_verification_code", "2fa_secret") VALUES (2, 'test2@a35.dev', 'testers2@byg', '$argon2id$v=19$m=65536,t=3,p=4$cUCfMXmyeQpQ91wq8B4JEw$n4LrwM5Peo3rWclNQkP6/aSzlzESuAgncwa4kJCn4p8', 1768501830000, NULL, NULL, NULL, 'plus_legacy', 'notable', NULL, '298160', NULL);
INSERT INTO "users" ("id", "email", "username", "pass_hash", "created_at", "bio", "avatar_url", "banner_url", "subscription_state", "verification", "color", "email_verification_code", "2fa_secret") VALUES (3, 'test3@a35.dev', 'testers3@byg', '$argon2id$v=19$m=65536,t=3,p=4$t6Ho++G9/cIDGpsVrD1vYA$nWCAqIy0GgFYoUqpG7of2g1rOmKk+7jPlXRfn9Ral/Y', 1768501907000, NULL, NULL, NULL, 'plus_legacy', 'government', '#c04a42', '617811', NULL);
INSERT INTO "users" ("id", "email", "username", "pass_hash", "created_at", "bio", "avatar_url", "banner_url", "subscription_state", "verification", "color", "email_verification_code", "2fa_secret") VALUES (4, 'test4@a35.dev', 'testers4@byg', '$argon2id$v=19$m=65536,t=3,p=4$9xmPzN23iNZjR2h/1n5QVg$4jTUmAWz9kqf1C4xxMF0RTuga77WuwB3dEsf7KN8Ny8', 1768502075000, NULL, NULL, NULL, 'plus_legacy', 'identity', '#bc369b', '214780', NULL);
INSERT INTO "users" ("id", "email", "username", "pass_hash", "created_at", "bio", "avatar_url", "banner_url", "subscription_state", "verification", "color", "email_verification_code", "2fa_secret") VALUES (5, 'test5@a35.dev', 'testers5@byg', '$argon2id$v=19$m=65536,t=3,p=4$8vcEeEIQdl5d218VMm7X5w$zzTqifRfMkZ0qm/7Lux67qantHegTv21qqQxGl7EPBo', 1768502136000, NULL, NULL, NULL, 'plus_legacy', NULL, '#308b47', '238986', NULL);
INSERT INTO "users" ("id", "email", "username", "pass_hash", "created_at", "bio", "avatar_url", "banner_url", "subscription_state", "verification", "color", "email_verification_code", "2fa_secret") VALUES (6, 'test6@a35.dev', 'testers6@byg', '$argon2id$v=19$m=65536,t=3,p=4$Yr30Pfw8bejJfPc2HEfnWw$6As/6/pgUfSChEmu5DIC9hHxGBky/vS87nhVXnSIffg', 1768502366000, NULL, NULL, NULL, 'plus_legacy', NULL, '#d92089', NULL, NULL);
INSERT INTO "users" ("id", "email", "username", "pass_hash", "created_at", "bio", "avatar_url", "banner_url", "subscription_state", "verification", "color", "email_verification_code", "2fa_secret") VALUES (7, 'test7@a35.dev', 'testers7@byg', '$argon2id$v=19$m=65536,t=3,p=4$10zqmOBW+453hVkihtc1Hg$EGyzdSACvWZQSkgir63m4wxs+9M/3ND/XgzQhDbFY0s', 1768502462000, 'This is epic. I love this.', 'https://a35hie.me/images/avatar-26.webp', 'https://cdn.discordapp.com/banners/1118629361675939860/b92091ff267b0995f02e9a07ab5c3e2b.png?size=1024', 'enterprise', NULL, '#6c57f0', NULL, NULL);
INSERT INTO "users" ("id", "email", "username", "pass_hash", "created_at", "bio", "avatar_url", "banner_url", "subscription_state", "verification", "color", "email_verification_code", "2fa_secret") VALUES (8, 'test8@a35.dev', 'testers8@byg', '$argon2id$v=19$m=65536,t=3,p=4$AdVP3CnWo7vVUxgUmBdejw$Hk1nJ+NGkmke57Y12jklZ1iIHf77uIm22cYlRHJjvys', 1768655885000, NULL, NULL, NULL, 'plus_legacy', NULL, NULL, '959842', NULL);
INSERT INTO "users" ("id", "email", "username", "pass_hash", "created_at", "bio", "avatar_url", "banner_url", "subscription_state", "verification", "color", "email_verification_code", "2fa_secret") VALUES (9, 'test9@a35.dev', 'testers9@byg', '$argon2id$v=19$m=65536,t=3,p=4$V304cBO3DLWNnrLSlO4uKw$RF1yE6J7XTSePiwZ3/ZFmT2OC1tlcVbrMc1Qoun0Yt0', 1775967558000, NULL, NULL, NULL, 'plus_legacy', NULL, NULL, NULL, 'NR7GAGVEPQ7BPKPRSVS664NRXO5R4CEV');
COMMIT;

-- ----------------------------
-- Auto increment value for followings
-- ----------------------------
UPDATE "main"."sqlite_sequence" SET seq = 9 WHERE name = 'followings';

-- ----------------------------
-- Auto increment value for image_comments
-- ----------------------------
UPDATE "main"."sqlite_sequence" SET seq = 3 WHERE name = 'image_comments';

-- ----------------------------
-- Auto increment value for images
-- ----------------------------
UPDATE "main"."sqlite_sequence" SET seq = 14 WHERE name = 'images';

-- ----------------------------
-- Auto increment value for messages
-- ----------------------------
UPDATE "main"."sqlite_sequence" SET seq = 107 WHERE name = 'messages';

-- ----------------------------
-- Auto increment value for post_comments
-- ----------------------------
UPDATE "main"."sqlite_sequence" SET seq = 28 WHERE name = 'post_comments';

-- ----------------------------
-- Auto increment value for posts
-- ----------------------------
UPDATE "main"."sqlite_sequence" SET seq = 31 WHERE name = 'posts';

-- ----------------------------
-- Auto increment value for users
-- ----------------------------
UPDATE "main"."sqlite_sequence" SET seq = 9 WHERE name = 'users';

-- ----------------------------
-- Indexes structure for table users
-- ----------------------------
CREATE UNIQUE INDEX "main"."users_email_unique"
ON "users" (
  "email" ASC
);
CREATE UNIQUE INDEX "main"."users_username_unique"
ON "users" (
  "username" ASC
);

PRAGMA foreign_keys = true;
