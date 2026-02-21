/*
SQLyog Ultimate v13.1.1 (64 bit)
MySQL - 8.3.0 : Database - newgenid_pos
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE /*!32312 IF NOT EXISTS*/`newgenid_pos` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `newgenid_pos`;

/*Table structure for table `accounts` */

DROP TABLE IF EXISTS `accounts`;

CREATE TABLE `accounts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `account_no` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `initial_balance` double DEFAULT NULL,
  `total_balance` double NOT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `is_default` tinyint(1) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `code` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `parent_account_id` int DEFAULT NULL,
  `is_payment` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `accounts` */

/*Table structure for table `activity_logs` */

DROP TABLE IF EXISTS `activity_logs`;

CREATE TABLE `activity_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `user_id` int NOT NULL,
  `reference_no` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `item_description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `activity_logs` */

/*Table structure for table `adjustments` */

DROP TABLE IF EXISTS `adjustments`;

CREATE TABLE `adjustments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `reference_no` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `warehouse_id` int NOT NULL,
  `document` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_qty` double NOT NULL,
  `item` int NOT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `adjustments` */

/*Table structure for table `attendances` */

DROP TABLE IF EXISTS `attendances`;

CREATE TABLE `attendances` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `employee_id` int NOT NULL,
  `user_id` int NOT NULL,
  `checkin` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checkout` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` int NOT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `attendances` */

/*Table structure for table `barcodes` */

DROP TABLE IF EXISTS `barcodes`;

CREATE TABLE `barcodes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `width` double DEFAULT NULL,
  `height` double DEFAULT NULL,
  `paper_width` double DEFAULT NULL,
  `paper_height` double DEFAULT NULL,
  `top_margin` double DEFAULT NULL,
  `left_margin` double DEFAULT NULL,
  `row_distance` double DEFAULT NULL,
  `col_distance` double DEFAULT NULL,
  `stickers_in_one_row` int DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL,
  `is_continuous` tinyint(1) NOT NULL,
  `stickers_in_one_sheet` int DEFAULT NULL,
  `is_custom` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `barcodes` */

/*Table structure for table `billers` */

DROP TABLE IF EXISTS `billers`;

CREATE TABLE `billers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vat_number` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_number` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `state` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `postal_code` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `billers` */

/*Table structure for table `brands` */

DROP TABLE IF EXISTS `brands`;

CREATE TABLE `brands` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `brands` */

insert  into `brands`(`id`,`title`,`image`,`is_active`,`created_at`,`updated_at`) values 
(1,'nike',NULL,1,'2026-02-10 14:08:34','2026-02-21 04:20:32'),
(2,'trqsd',NULL,1,'2026-02-14 14:44:52','2026-02-14 14:44:52');

/*Table structure for table `cache` */

DROP TABLE IF EXISTS `cache`;

CREATE TABLE `cache` (
  `key` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `cache` */

/*Table structure for table `cache_locks` */

DROP TABLE IF EXISTS `cache_locks`;

CREATE TABLE `cache_locks` (
  `key` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `cache_locks` */

/*Table structure for table `cash_registers` */

DROP TABLE IF EXISTS `cash_registers`;

CREATE TABLE `cash_registers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `cash_in_hand` double NOT NULL,
  `closing_balance` double DEFAULT NULL,
  `actual_cash` double DEFAULT NULL,
  `user_id` int NOT NULL,
  `warehouse_id` int NOT NULL,
  `status` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `cash_registers` */

/*Table structure for table `categories` */

DROP TABLE IF EXISTS `categories`;

CREATE TABLE `categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parent_id` int DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `categories` */

insert  into `categories`(`id`,`name`,`image`,`parent_id`,`is_active`,`created_at`,`updated_at`) values 
(1,'test ter',NULL,NULL,1,'2026-02-08 13:42:40','2026-02-14 14:36:26'),
(2,'test 24',NULL,NULL,NULL,'2026-02-08 13:49:26','2026-02-08 13:54:39');

/*Table structure for table `challans` */

DROP TABLE IF EXISTS `challans`;

CREATE TABLE `challans` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `reference_no` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `courier_id` int NOT NULL,
  `packing_slip_list` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount_list` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `cash_list` longtext COLLATE utf8mb4_unicode_ci,
  `online_payment_list` longtext COLLATE utf8mb4_unicode_ci,
  `cheque_list` longtext COLLATE utf8mb4_unicode_ci,
  `delivery_charge_list` longtext COLLATE utf8mb4_unicode_ci,
  `status_list` longtext COLLATE utf8mb4_unicode_ci,
  `closing_date` date DEFAULT NULL,
  `created_by_id` int NOT NULL,
  `closed_by_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `challans` */

/*Table structure for table `coupons` */

DROP TABLE IF EXISTS `coupons`;

CREATE TABLE `coupons` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` double NOT NULL,
  `minimum_amount` double DEFAULT NULL,
  `quantity` int NOT NULL,
  `used` int NOT NULL,
  `expired_date` date NOT NULL,
  `user_id` int NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `coupons` */

/*Table structure for table `couriers` */

DROP TABLE IF EXISTS `couriers`;

CREATE TABLE `couriers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `api_key` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `secret_key` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `couriers` */

/*Table structure for table `currencies` */

DROP TABLE IF EXISTS `currencies`;

CREATE TABLE `currencies` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `symbol` varchar(2) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `exchange_rate` double NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `currencies` */

/*Table structure for table `custom_fields` */

DROP TABLE IF EXISTS `custom_fields`;

CREATE TABLE `custom_fields` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `belongs_to` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `default_value` text COLLATE utf8mb4_unicode_ci,
  `option_value` text COLLATE utf8mb4_unicode_ci,
  `grid_value` int NOT NULL,
  `is_table` tinyint(1) NOT NULL,
  `is_invoice` tinyint(1) NOT NULL,
  `is_required` tinyint(1) NOT NULL,
  `is_admin` tinyint(1) NOT NULL,
  `is_disable` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `custom_fields` */

/*Table structure for table `customer_groups` */

DROP TABLE IF EXISTS `customer_groups`;

CREATE TABLE `customer_groups` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `percentage` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `customer_groups` */

/*Table structure for table `customers` */

DROP TABLE IF EXISTS `customers`;

CREATE TABLE `customers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `customer_group_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` enum('regular','walkin') COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_number` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `wa_number` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tax_no` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `postal_code` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `opening_balance` double NOT NULL,
  `credit_limit` double DEFAULT NULL,
  `points` double DEFAULT NULL,
  `deposit` double DEFAULT NULL,
  `pay_term_no` int DEFAULT NULL,
  `pay_term_period` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expense` double DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `customers` */

/*Table structure for table `deliveries` */

DROP TABLE IF EXISTS `deliveries`;

CREATE TABLE `deliveries` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `reference_no` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sale_id` int NOT NULL,
  `packing_slip_ids` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `courier_id` int DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `delivered_by` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recieved_by` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `deliveries` */

/*Table structure for table `departments` */

DROP TABLE IF EXISTS `departments`;

CREATE TABLE `departments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `departments` */

/*Table structure for table `deposits` */

DROP TABLE IF EXISTS `deposits`;

CREATE TABLE `deposits` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `amount` double NOT NULL,
  `customer_id` int NOT NULL,
  `user_id` int NOT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `deposits` */

/*Table structure for table `designations` */

DROP TABLE IF EXISTS `designations`;

CREATE TABLE `designations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL COMMENT 'Active or inactive designation',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `designations` */

/*Table structure for table `discount_plan_customers` */

DROP TABLE IF EXISTS `discount_plan_customers`;

CREATE TABLE `discount_plan_customers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `discount_plan_id` int NOT NULL,
  `customer_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `discount_plan_customers` */

/*Table structure for table `discount_plan_discounts` */

DROP TABLE IF EXISTS `discount_plan_discounts`;

CREATE TABLE `discount_plan_discounts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `discount_id` int NOT NULL,
  `discount_plan_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `discount_plan_discounts` */

/*Table structure for table `discount_plans` */

DROP TABLE IF EXISTS `discount_plans`;

CREATE TABLE `discount_plans` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('generic','limited') COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `discount_plans` */

/*Table structure for table `discounts` */

DROP TABLE IF EXISTS `discounts`;

CREATE TABLE `discounts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('percentage','flat') COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` decimal(15,2) NOT NULL,
  `applicable_for` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'All',
  `product_list` text COLLATE utf8mb4_unicode_ci,
  `valid_from` date NOT NULL,
  `valid_till` date NOT NULL,
  `days` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `minimum_qty` int NOT NULL DEFAULT '1',
  `maximum_qty` int NOT NULL DEFAULT '999999',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `discounts` */

/*Table structure for table `dso_alerts` */

DROP TABLE IF EXISTS `dso_alerts`;

CREATE TABLE `dso_alerts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_info` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `number_of_products` int NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `dso_alerts` */

/*Table structure for table `employees` */

DROP TABLE IF EXISTS `employees`;

CREATE TABLE `employees` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_number` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `department_id` int NOT NULL,
  `designation_id` bigint unsigned DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `staff_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `is_sale_agent` tinyint(1) NOT NULL,
  `shift_id` bigint unsigned DEFAULT NULL,
  `basic_salary` decimal(12,2) NOT NULL,
  `sale_commission_percent` decimal(8,2) DEFAULT NULL,
  `sales_target` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `employees` */

/*Table structure for table `expense_categories` */

DROP TABLE IF EXISTS `expense_categories`;

CREATE TABLE `expense_categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `expense_categories` */

/*Table structure for table `expenses` */

DROP TABLE IF EXISTS `expenses`;

CREATE TABLE `expenses` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `reference_no` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expense_category_id` int NOT NULL,
  `warehouse_id` int NOT NULL,
  `account_id` int NOT NULL,
  `user_id` int NOT NULL,
  `employee_id` bigint unsigned DEFAULT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cash_register_id` int DEFAULT NULL,
  `amount` double NOT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `document` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `expenses` */

/*Table structure for table `external_services` */

DROP TABLE IF EXISTS `external_services`;

CREATE TABLE `external_services` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `details` longtext COLLATE utf8mb4_unicode_ci,
  `module_status` json DEFAULT NULL,
  `active` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `external_services` */

/*Table structure for table `failed_jobs` */

DROP TABLE IF EXISTS `failed_jobs`;

CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `failed_jobs` */

/*Table structure for table `general_settings` */

DROP TABLE IF EXISTS `general_settings`;

CREATE TABLE `general_settings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `site_title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `site_logo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `favicon` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_rtl` tinyint(1) DEFAULT NULL,
  `currency` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `package_id` int DEFAULT NULL,
  `subscription_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `staff_access` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `without_stock` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_format` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `developed_by` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoice_format` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `decimal` int DEFAULT NULL,
  `state` int DEFAULT NULL,
  `theme` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `modules` text COLLATE utf8mb4_unicode_ci,
  `currency_position` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiry_date` date DEFAULT NULL,
  `expiry_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiry_value` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiry_alert_days` int unsigned NOT NULL COMMENT 'Number of days before expiry to show alert',
  `is_zatca` tinyint(1) DEFAULT NULL,
  `company_name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vat_registration_number` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_packing_slip` tinyint(1) NOT NULL,
  `app_key` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `token` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `show_products_details_in_sales_table` tinyint NOT NULL,
  `show_products_details_in_purchase_table` tinyint NOT NULL,
  `default_margin_value` decimal(8,2) NOT NULL,
  `timezone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `font_css` text COLLATE utf8mb4_unicode_ci,
  `auth_css` longtext COLLATE utf8mb4_unicode_ci,
  `pos_css` longtext COLLATE utf8mb4_unicode_ci,
  `custom_css` longtext COLLATE utf8mb4_unicode_ci,
  `disable_signup` int NOT NULL,
  `disable_forgot_password` int NOT NULL,
  `margin_type` int NOT NULL,
  `maintenance_allowed_ips` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `general_settings` */

/*Table structure for table `gift_card_recharges` */

DROP TABLE IF EXISTS `gift_card_recharges`;

CREATE TABLE `gift_card_recharges` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `gift_card_id` int NOT NULL,
  `amount` double NOT NULL,
  `user_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `gift_card_recharges` */

/*Table structure for table `gift_cards` */

DROP TABLE IF EXISTS `gift_cards`;

CREATE TABLE `gift_cards` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `card_no` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` double NOT NULL,
  `expense` double NOT NULL,
  `customer_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `expired_date` date DEFAULT NULL,
  `created_by` int NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `gift_cards` */

/*Table structure for table `holidays` */

DROP TABLE IF EXISTS `holidays`;

CREATE TABLE `holidays` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `from_date` date NOT NULL,
  `to_date` date NOT NULL,
  `recurring` tinyint(1) NOT NULL,
  `region` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `is_approved` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `holidays` */

/*Table structure for table `hrm_settings` */

DROP TABLE IF EXISTS `hrm_settings`;

CREATE TABLE `hrm_settings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `checkin` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checkout` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `hrm_settings` */

/*Table structure for table `income_categories` */

DROP TABLE IF EXISTS `income_categories`;

CREATE TABLE `income_categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `income_categories` */

/*Table structure for table `incomes` */

DROP TABLE IF EXISTS `incomes`;

CREATE TABLE `incomes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `reference_no` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `income_category_id` int NOT NULL,
  `warehouse_id` int NOT NULL,
  `account_id` int NOT NULL,
  `user_id` int NOT NULL,
  `cash_register_id` int DEFAULT NULL,
  `amount` double NOT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `incomes` */

/*Table structure for table `installment_plans` */

DROP TABLE IF EXISTS `installment_plans`;

CREATE TABLE `installment_plans` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_type` enum('sale','purchase') COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_id` bigint unsigned NOT NULL,
  `price` decimal(15,2) NOT NULL,
  `additional_amount` decimal(15,2) NOT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `down_payment` decimal(15,2) NOT NULL,
  `months` int NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `installment_plans` */

/*Table structure for table `installments` */

DROP TABLE IF EXISTS `installments`;

CREATE TABLE `installments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `installment_plan_id` bigint unsigned NOT NULL,
  `status` enum('pending','completed') COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_date` timestamp NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `installments` */

/*Table structure for table `invoice_schemas` */

DROP TABLE IF EXISTS `invoice_schemas`;

CREATE TABLE `invoice_schemas` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `prefix` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `number_of_digit` int unsigned DEFAULT NULL,
  `start_number` bigint unsigned DEFAULT NULL,
  `last_invoice_number` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `invoice_schemas` */

/*Table structure for table `invoice_settings` */

DROP TABLE IF EXISTS `invoice_settings`;

CREATE TABLE `invoice_settings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `template_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoice_logo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_type` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `prefix` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `number_of_digit` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `numbering_type` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `start_number` bigint unsigned DEFAULT NULL,
  `last_invoice_number` bigint unsigned DEFAULT NULL,
  `header_text` text COLLATE utf8mb4_unicode_ci,
  `header_title` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `footer_text` text COLLATE utf8mb4_unicode_ci,
  `footer_title` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `preview_invoice` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `size` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `primary_color` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `secondary_color` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `text_color` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company_logo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logo_height` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logo_width` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL COMMENT '0=not default, 1=default',
  `status` tinyint(1) NOT NULL,
  `invoice_date_format` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `show_column` json DEFAULT NULL,
  `extra` json DEFAULT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `updated_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `invoice_settings` */

/*Table structure for table `job_batches` */

DROP TABLE IF EXISTS `job_batches`;

CREATE TABLE `job_batches` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `job_batches` */

/*Table structure for table `jobs` */

DROP TABLE IF EXISTS `jobs`;

CREATE TABLE `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` tinyint unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `jobs` */

/*Table structure for table `languages` */

DROP TABLE IF EXISTS `languages`;

CREATE TABLE `languages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `language` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_default` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `languages` */

/*Table structure for table `leave_types` */

DROP TABLE IF EXISTS `leave_types`;

CREATE TABLE `leave_types` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `annual_quota` int NOT NULL,
  `encashable` tinyint(1) NOT NULL,
  `carry_forward_limit` int NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `leave_types` */

/*Table structure for table `leaves` */

DROP TABLE IF EXISTS `leaves`;

CREATE TABLE `leaves` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` bigint unsigned NOT NULL,
  `leave_types` bigint unsigned NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `days` int NOT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `approver_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `leaves` */

/*Table structure for table `mail_settings` */

DROP TABLE IF EXISTS `mail_settings`;

CREATE TABLE `mail_settings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `driver` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `host` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `port` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `from_address` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `from_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `encryption` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `mail_settings` */

/*Table structure for table `menu_role` */

DROP TABLE IF EXISTS `menu_role`;

CREATE TABLE `menu_role` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `menu_id` bigint unsigned NOT NULL,
  `role_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `menu_role_menu_id_role_id_unique` (`menu_id`,`role_id`),
  KEY `menu_role_role_id_foreign` (`role_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `menu_role` */

/*Table structure for table `menus` */

DROP TABLE IF EXISTS `menus`;

CREATE TABLE `menus` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `main_menu_icon` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `main_menu` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sub_menu_icon` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sub_menu` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sub_menu_route` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `second_sub_menu_icon` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `second_sub_menu` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `route` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `controller` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `main_menu_order` int DEFAULT NULL,
  `sub_menu_order` int DEFAULT NULL,
  `child_menu_order` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=106 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `menus` */

insert  into `menus`(`id`,`main_menu_icon`,`main_menu`,`sub_menu_icon`,`sub_menu`,`sub_menu_route`,`second_sub_menu_icon`,`second_sub_menu`,`route`,`controller`,`main_menu_order`,`sub_menu_order`,`child_menu_order`,`is_active`,`created_at`,`updated_at`) values 
(1,'pi pi-fw pi-briefcase','Master','pi pi-fw pi-user','Category',NULL,'','','/category','categories',1,1,1,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(2,'pi pi-fw pi-briefcase','Master','pi pi-fw pi-user','Brand',NULL,'','','/brand','brands',1,1,2,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(3,'pi pi-fw pi-briefcase','Master','pi pi-fw pi-user','Units',NULL,'','','/units','units',1,1,3,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(4,'pi pi-fw pi-briefcase','Product','pi pi-fw pi-user','Product List',NULL,'','','/product-list','products',1,1,4,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(5,'pi pi-fw pi-briefcase','Product','pi pi-fw pi-user','Product',NULL,'','','/products','products',1,1,5,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(6,'pi pi-fw pi-briefcase','Product','pi pi-fw pi-user','Add Product',NULL,'','','/product-print-barcode','barcodes',1,1,6,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(7,'pi pi-fw pi-briefcase','Product','pi pi-fw pi-user','Adjustment List',NULL,'','','/product/adjustment-list','adjustments',1,1,7,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(8,'pi pi-fw pi-briefcase','Product','pi pi-fw pi-user','Add Adjustment',NULL,'','','/product/add-adjustment','adjustments',1,1,8,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(9,'pi pi-fw pi-briefcase','Product','pi pi-fw pi-user','Product',NULL,'','','/product/stock-count','stock-counts',1,1,9,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(10,'pi pi-fw pi-briefcase','Purchase','pi pi-fw pi-shopping-cart','Purchase List',NULL,'','','/purchase/list','purchases',1,2,1,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(11,'pi pi-fw pi-briefcase','Purchase','pi pi-fw pi-shopping-cart','Add Purchase',NULL,'','','/purchase-create','purchases',1,2,2,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(12,'pi pi-fw pi-briefcase','Purchase','pi pi-fw pi-shopping-cart','Import Purchase By CSV',NULL,'','','/purchase/import-csv','purchases',1,2,3,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(13,'pi pi-fw pi-briefcase','Purchase','pi pi-fw pi-shopping-cart','Purchase Return List',NULL,'','','/return-purchase-create','purchase-returns',1,2,4,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(14,'pi pi-fw pi-briefcase','Sale','pi pi-fw pi-shopping-bag','Sale List',NULL,'','','/sales-list','sales',1,3,1,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(15,'pi pi-fw pi-briefcase','Sale','pi pi-fw pi-shopping-bag','Sale',NULL,'','','/pos','pos',1,3,2,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(16,'pi pi-fw pi-briefcase','Sale','pi pi-fw pi-shopping-bag','POS',NULL,'','','/sale/add','sales',1,3,3,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(17,'pi pi-fw pi-briefcase','Sale','pi pi-fw pi-shopping-bag','Sale',NULL,'','','/sale/import-csv','sales',1,3,4,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(18,'pi pi-fw pi-briefcase','Sale','pi pi-fw pi-shopping-bag','Import Sale By CSV',NULL,'','','/packing-slip-list','packing-slips',1,3,5,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(19,'pi pi-fw pi-briefcase','Sale','pi pi-fw pi-shopping-bag','Challan List',NULL,'','','/challan-list','challans',1,3,6,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(20,'pi pi-fw pi-briefcase','Sale','pi pi-fw pi-shopping-bag','Delivery List',NULL,'','','/delivery-list','deliveries',1,3,7,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(21,'pi pi-fw pi-briefcase','Sale','pi pi-fw pi-shopping-bag','Gift Card List',NULL,'','','/gift-card-list','gift-cards',1,3,8,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(22,'pi pi-fw pi-briefcase','Sale','pi pi-fw pi-shopping-bag','Coupon List',NULL,'','','/coupon-list','coupons',1,3,9,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(23,'pi pi-fw pi-briefcase','Sale','pi pi-fw pi-shopping-bag','Courier List',NULL,'','','/courier-list','couriers',1,3,10,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(24,'pi pi-fw pi-briefcase','Sale','pi pi-fw pi-shopping-bag','Sale Return',NULL,'','','/sale-return-list','returns',1,3,11,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(25,'pi pi-fw pi-briefcase','Quotation','pi pi-fw pi-file-edit','Quotation List',NULL,'','','/quotation-list','quotations',1,4,1,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(26,'pi pi-fw pi-briefcase','Quotation','pi pi-fw pi-file-edit','Add Quotation',NULL,'','','/quotation/add','quotations',1,4,2,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(27,'pi pi-fw pi-briefcase','Transfer','pi pi-fw pi-arrow-right-arrow-left','Transfer List',NULL,'','','/transfer-list','transfers',1,5,1,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(28,'pi pi-fw pi-briefcase','Transfer','pi pi-fw pi-arrow-right-arrow-left','Add Transfer',NULL,'','','/transfer/add','transfers',1,5,2,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(29,'pi pi-fw pi-briefcase','Transfer','pi pi-fw pi-arrow-right-arrow-left','Import Transfer By CSV',NULL,'','','/transfer/import-csv','transfers',1,5,3,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(30,'pi pi-fw pi-briefcase','Expense','pi pi-fw pi-wallet','Expense List',NULL,'','','/expense-list','expenses',1,6,1,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(31,'pi pi-fw pi-briefcase','Expense','pi pi-fw pi-wallet','Add Expense',NULL,'','','/expense/add','expenses',1,6,2,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(32,'pi pi-fw pi-briefcase','Income','pi pi-fw pi-money-bill','Income List',NULL,'','','/income-list','incomes',1,7,1,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(33,'pi pi-fw pi-briefcase','Income','pi pi-fw pi-money-bill','Add Income',NULL,'','','/income/add','incomes',1,7,2,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(34,'pi pi-fw pi-briefcase','People','pi pi-fw pi-users','Customer List',NULL,'','','/customer-list','customers',1,8,1,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(35,'pi pi-fw pi-briefcase','People','pi pi-fw pi-users','Supplier List',NULL,'','','/supplier-list','suppliers',1,8,2,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(36,'pi pi-fw pi-briefcase','People','pi pi-fw pi-users','User List',NULL,'','','/user-list','users',1,8,3,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(37,'pi pi-fw pi-briefcase','People','pi pi-fw pi-users','Sale Agents',NULL,'','','/sale-agents','employees',1,8,4,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(38,'pi pi-fw pi-briefcase','People','pi pi-fw pi-users','Biller List',NULL,'','','/biller-list','billers',1,8,5,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(39,'pi pi-fw pi-briefcase','Accounting','pi pi-fw pi-calculator','Account List',NULL,'','','/account-list','accounts',1,9,1,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(40,'pi pi-fw pi-briefcase','Accounting','pi pi-fw pi-calculator','Add Account',NULL,'','','/accounting/add-account','accounts',1,9,2,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(41,'pi pi-fw pi-briefcase','Accounting','pi pi-fw pi-calculator','Money Transfer',NULL,'','','/money-transfer','money-transfers',1,9,3,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(42,'pi pi-fw pi-briefcase','Accounting','pi pi-fw pi-calculator','Balance Sheet',NULL,'','','/balance-sheet','balance-sheets',1,9,4,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(43,'pi pi-fw pi-briefcase','Accounting','pi pi-fw pi-calculator','Account Statement',NULL,'','','/account-statement','account-statements',1,9,5,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(44,'pi pi-fw pi-briefcase','HRM','pi pi-fw pi-sitemap','Department',NULL,'','','/hrm/department','departments',1,10,1,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(45,'pi pi-fw pi-briefcase','HRM','pi pi-fw pi-sitemap','Designation',NULL,'','','/hrm/designation','designations',1,10,2,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(46,'pi pi-fw pi-briefcase','HRM','pi pi-fw pi-sitemap','Shift',NULL,'','','/hrm/shift','shifts',1,10,3,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(47,'pi pi-fw pi-briefcase','HRM','pi pi-fw pi-sitemap','Employee',NULL,'','','/hrm/employee','employees',1,10,4,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(48,'pi pi-fw pi-briefcase','HRM','pi pi-fw pi-sitemap','Attendance',NULL,'','','/hrm/attendance','attendance',1,10,5,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(49,'pi pi-fw pi-briefcase','HRM','pi pi-fw pi-sitemap','Holiday',NULL,'','','/hrm/holiday','holidays',1,10,6,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(50,'pi pi-fw pi-briefcase','HRM','pi pi-fw pi-sitemap','Overtime',NULL,'','','/hrm/overtime','overtime',1,10,7,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(51,'pi pi-fw pi-briefcase','HRM','pi pi-fw pi-sitemap','Leave Type',NULL,'','','/hrm/leave-type','leave-types',1,10,8,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(52,'pi pi-fw pi-briefcase','HRM','pi pi-fw pi-sitemap','Leaves',NULL,'','','/hrm/leaves','leaves',1,10,9,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(53,'pi pi-fw pi-briefcase','HRM','pi pi-fw pi-sitemap','Payroll',NULL,'','','/hrm/payroll','payrolls',1,10,10,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(54,'pi pi-fw pi-briefcase','Main','pi pi-fw pi-chart-bar','Reports',NULL,'pi pi-fw pi-history','Activity Log','/reports/activity-log','activity-logs',1,11,1,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(55,'pi pi-fw pi-briefcase','Main','pi pi-fw pi-chart-bar','Reports',NULL,'pi pi-fw pi-file','Summary Report','/reports/summary-report','reports',1,11,2,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(56,'pi pi-fw pi-briefcase','Main','pi pi-fw pi-chart-bar','Reports',NULL,'pi pi-fw pi-star','Best Seller','/reports/best-seller','reports',1,11,3,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(57,'pi pi-fw pi-briefcase','Main','pi pi-fw pi-chart-bar','Reports',NULL,'pi pi-fw pi-box','Product Report','/reports/product-report','reports',1,11,4,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(58,'pi pi-fw pi-briefcase','Main','pi pi-fw pi-chart-bar','Reports',NULL,'pi pi-fw pi-calendar','Daily Sale','/reports/daily-sale','reports',1,11,5,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(59,'pi pi-fw pi-briefcase','Main','pi pi-fw pi-chart-bar','Reports',NULL,'pi pi-fw pi-calendar-plus','Monthly Sale','/reports/monthly-sale','reports',1,11,6,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(60,'pi pi-fw pi-briefcase','Main','pi pi-fw pi-chart-bar','Reports',NULL,'pi pi-fw pi-calendar','Daily Purchase','/reports/daily-purchase','reports',1,11,7,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(61,'pi pi-fw pi-briefcase','Main','pi pi-fw pi-chart-bar','Reports',NULL,'pi pi-fw pi-calendar-plus','Monthly Purchase','/reports/monthly-purchase','reports',1,11,8,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(62,'pi pi-fw pi-briefcase','Main','pi pi-fw pi-chart-bar','Reports',NULL,'pi pi-fw pi-shopping-bag','Sale Report','/reports/sale-report','reports',1,11,9,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(63,'pi pi-fw pi-briefcase','Main','pi pi-fw pi-chart-bar','Reports',NULL,'pi pi-fw pi-file-pdf','Challan Report','/reports/challan-report','reports',1,11,10,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(64,'pi pi-fw pi-briefcase','Main','pi pi-fw pi-chart-bar','Reports',NULL,'pi pi-fw pi-chart-line','Sale Report Chart','/reports/sale-report-chart','reports',1,11,11,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(65,'pi pi-fw pi-briefcase','Main','pi pi-fw pi-chart-bar','Reports',NULL,'pi pi-fw pi-credit-card','Payment Report','/reports/payment-report','reports',1,11,12,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(66,'pi pi-fw pi-briefcase','Main','pi pi-fw pi-chart-bar','Reports',NULL,'pi pi-fw pi-shopping-cart','Purchase Report','/reports/purchase-report','reports',1,11,13,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(67,'pi pi-fw pi-briefcase','Main','pi pi-fw pi-chart-bar','Reports',NULL,'pi pi-fw pi-user','Customer Report','/reports/customer-report','reports',1,11,14,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(68,'pi pi-fw pi-briefcase','Main','pi pi-fw pi-chart-bar','Reports',NULL,'pi pi-fw pi-users','Customer Group Report','/reports/customer-group-report','reports',1,11,15,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(69,'pi pi-fw pi-briefcase','Main','pi pi-fw pi-chart-bar','Reports',NULL,'pi pi-fw pi-exclamation-circle','Customer Due Report','/reports/customer-due-report','reports',1,11,16,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(70,'pi pi-fw pi-briefcase','Main','pi pi-fw pi-chart-bar','Reports',NULL,'pi pi-fw pi-building','Supplier Report','/reports/supplier-report','reports',1,11,17,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(71,'pi pi-fw pi-briefcase','Main','pi pi-fw pi-chart-bar','Reports',NULL,'pi pi-fw pi-exclamation-triangle','Supplier Due Report','/reports/supplier-due-report','reports',1,11,18,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(72,'pi pi-fw pi-briefcase','Main','pi pi-fw pi-chart-bar','Reports',NULL,'pi pi-fw pi-warehouse','Warehouse Report','/reports/warehouse-report','reports',1,11,19,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(73,'pi pi-fw pi-briefcase','Main','pi pi-fw pi-chart-bar','Reports',NULL,'pi pi-fw pi-chart-pie','Warehouse Stock Chart','/reports/warehouse-stock-chart','reports',1,11,20,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(74,'pi pi-fw pi-briefcase','Main','pi pi-fw pi-chart-bar','Reports',NULL,'pi pi-fw pi-calendar-times','Product Expiry Report','/reports/product-expiry-report','reports',1,11,21,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(75,'pi pi-fw pi-briefcase','Main','pi pi-fw pi-chart-bar','Reports',NULL,'pi pi-fw pi-bell','Product Quantity Alert','/reports/product-quantity-alert','reports',1,11,22,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(76,'pi pi-fw pi-briefcase','Main','pi pi-fw pi-chart-bar','Reports',NULL,'pi pi-fw pi-flag','Daily Sale Objective Report','/reports/daily-sale-objective-report','reports',1,11,23,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(77,'pi pi-fw pi-briefcase','Main','pi pi-fw pi-chart-bar','Reports',NULL,'pi pi-fw pi-user','User Report','/reports/user-report','reports',1,11,24,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(78,'pi pi-fw pi-briefcase','Main','pi pi-fw pi-chart-bar','Reports',NULL,'pi pi-fw pi-id-card','Biller Report','/reports/biller-report','reports',1,11,25,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(79,'pi pi-fw pi-briefcase','Main','pi pi-fw pi-chart-bar','Reports',NULL,'pi pi-fw pi-wallet','Cash Register','/reports/cash-register','reports',1,11,26,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(80,'pi pi-fw pi-briefcase','Settings','pi pi-fw pi-cog','Receipt Printers',NULL,'','','/receipt-printers','printers',1,12,1,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(81,'pi pi-fw pi-briefcase','Settings','pi pi-fw pi-cog','Invoice Settings',NULL,'','','/invoice-settings','invoice-settings',1,12,2,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(82,'pi pi-fw pi-briefcase','Settings','pi pi-fw pi-cog','Role Permission',NULL,'','','/settings/role-permission','role-permissions',1,12,3,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(83,'pi pi-fw pi-briefcase','Settings','pi pi-fw pi-cog','SMS Template',NULL,'','','/sms-template','sms-templates',1,12,4,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(84,'pi pi-fw pi-briefcase','Settings','pi pi-fw pi-cog','Custom Field List',NULL,'','','/settings/custom-field-list','custom-fields',1,12,5,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(85,'pi pi-fw pi-briefcase','Settings','pi pi-fw pi-cog','Discount Plan',NULL,'','','/discount-plan','discount-plans',1,12,6,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(86,'pi pi-fw pi-briefcase','Settings','pi pi-fw pi-cog','Discount',NULL,'','','/discount','discounts',1,12,7,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(87,'pi pi-fw pi-briefcase','Settings','pi pi-fw pi-cog','All Notification',NULL,'','','/settings/all-notification','notifications',1,12,8,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(88,'pi pi-fw pi-briefcase','Settings','pi pi-fw pi-cog','Send Notification',NULL,'','','/settings/send-notification','notifications',1,12,9,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(89,'pi pi-fw pi-briefcase','Settings','pi pi-fw pi-cog','Warehouse',NULL,'','','/warehouse','warehouses',1,12,10,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(90,'pi pi-fw pi-briefcase','Settings','pi pi-fw pi-cog','Tables',NULL,'','','/settings/tables','tables',1,12,11,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(91,'pi pi-fw pi-briefcase','Settings','pi pi-fw pi-cog','Customer Group',NULL,'','','/customer-group','customer-groups',1,12,12,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(92,'pi pi-fw pi-briefcase','Settings','pi pi-fw pi-cog','Currency',NULL,'','','/settings/currency','currencies',1,12,13,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(93,'pi pi-fw pi-briefcase','Settings','pi pi-fw pi-cog','Tax',NULL,'','','/tax','taxes',1,12,14,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(94,'pi pi-fw pi-briefcase','Settings','pi pi-fw pi-cog','User Profile',NULL,'','','/user-profile','user-profile',1,12,15,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(95,'pi pi-fw pi-briefcase','Settings','pi pi-fw pi-cog','Create SMS',NULL,'','','/create-sms','sms-templates',1,12,16,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(96,'pi pi-fw pi-briefcase','Settings','pi pi-fw pi-cog','Backup Database',NULL,'','','/settings/backup-database','backup-database',1,12,17,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(97,'pi pi-fw pi-briefcase','Settings','pi pi-fw pi-cog','General Setting',NULL,'','','/general-settings','general-settings',1,12,18,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(98,'pi pi-fw pi-briefcase','Settings','pi pi-fw pi-cog','Mail Setting',NULL,'','','/settings/mail-setting','mail-settings',1,12,19,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(99,'pi pi-fw pi-briefcase','Settings','pi pi-fw pi-cog','Reward Point Setting',NULL,'','','/reward-point-setting','reward-point-settings',1,12,20,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(100,'pi pi-fw pi-briefcase','Settings','pi pi-fw pi-cog','SMS Setting',NULL,'','','/settings/sms-setting','sms-settings',1,12,21,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(101,'pi pi-fw pi-briefcase','Settings','pi pi-fw pi-cog','Payment Gateways',NULL,'','','/settings/payment-gateways','payment-gateways',1,12,22,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(102,'pi pi-fw pi-briefcase','Settings','pi pi-fw pi-cog','POS Settings',NULL,'','','/pos-settings','pos-settings',1,12,23,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(103,'pi pi-fw pi-briefcase','Settings','pi pi-fw pi-cog','HRM Setting',NULL,'','','/settings/hrm-setting','hrm-settings',1,12,24,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(104,'pi pi-fw pi-briefcase','Settings','pi pi-fw pi-cog','Barcode Settings',NULL,'','','/barcode-settings','barcode-settings',1,12,25,1,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(105,'pi pi-fw pi-briefcase','Settings','pi pi-fw pi-cog','Languages',NULL,'','','/settings/languages','languages',1,12,26,1,'2026-02-08 13:40:12','2026-02-08 13:40:12');

/*Table structure for table `migrations` */

DROP TABLE IF EXISTS `migrations`;

CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=103 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `migrations` */

insert  into `migrations`(`id`,`migration`,`batch`) values 
(1,'0001_01_01_000000_create_users_table',1),
(2,'0001_01_01_000001_create_cache_table',1),
(3,'0001_01_01_000002_create_jobs_table',1),
(4,'2026_02_08_000000_create_accounts_table',1),
(5,'2026_02_08_000001_create_activity_logs_table',1),
(6,'2026_02_08_000002_create_adjustments_table',1),
(7,'2026_02_08_000003_create_attendances_table',1),
(8,'2026_02_08_000004_create_barcodes_table',1),
(9,'2026_02_08_000005_create_billers_table',1),
(10,'2026_02_08_000006_create_brands_table',1),
(11,'2026_02_08_000007_create_cash_registers_table',1),
(12,'2026_02_08_000008_create_categories_table',1),
(13,'2026_02_08_000009_create_challans_table',1),
(14,'2026_02_08_000010_create_coupons_table',1),
(15,'2026_02_08_000011_create_couriers_table',1),
(16,'2026_02_08_000012_create_currencies_table',1),
(17,'2026_02_08_000013_create_custom_fields_table',1),
(18,'2026_02_08_000014_create_customer_groups_table',1),
(19,'2026_02_08_000015_create_customers_table',1),
(20,'2026_02_08_000016_create_deliveries_table',1),
(21,'2026_02_08_000017_create_departments_table',1),
(22,'2026_02_08_000018_create_deposits_table',1),
(23,'2026_02_08_000019_create_designations_table',1),
(24,'2026_02_08_000020_create_discount_plan_customers_table',1),
(25,'2026_02_08_000021_create_discount_plan_discounts_table',1),
(26,'2026_02_08_000022_create_discount_plans_table',1),
(27,'2026_02_08_000023_create_dso_alerts_table',1),
(28,'2026_02_08_000024_create_employees_table',1),
(29,'2026_02_08_000025_create_expense_categories_table',1),
(30,'2026_02_08_000026_create_expenses_table',1),
(31,'2026_02_08_000027_create_external_services_table',1),
(32,'2026_02_08_000028_create_general_settings_table',1),
(33,'2026_02_08_000029_create_gift_card_recharges_table',1),
(34,'2026_02_08_000030_create_gift_cards_table',1),
(35,'2026_02_08_000031_create_holidays_table',1),
(36,'2026_02_08_000032_create_hrm_settings_table',1),
(37,'2026_02_08_000033_create_income_categories_table',1),
(38,'2026_02_08_000034_create_incomes_table',1),
(39,'2026_02_08_000035_create_installment_plans_table',1),
(40,'2026_02_08_000036_create_installments_table',1),
(41,'2026_02_08_000037_create_invoice_schemas_table',1),
(42,'2026_02_08_000038_create_invoice_settings_table',1),
(43,'2026_02_08_000039_create_languages_table',1),
(44,'2026_02_08_000040_create_leave_types_table',1),
(45,'2026_02_08_000041_create_leaves_table',1),
(46,'2026_02_08_000042_create_mail_settings_table',1),
(47,'2026_02_08_000043_create_mobile_tokens_table',1),
(48,'2026_02_08_000044_create_money_transfers_table',1),
(49,'2026_02_08_000045_create_notifications_table',1),
(50,'2026_02_08_000046_create_overtimes_table',1),
(51,'2026_02_08_000047_create_packing_slip_products_table',1),
(52,'2026_02_08_000048_create_packing_slips_table',1),
(53,'2026_02_08_000049_create_payment_with_cheques_table',1),
(54,'2026_02_08_000050_create_payment_with_credit_cards_table',1),
(55,'2026_02_08_000051_create_payment_with_gift_cards_table',1),
(56,'2026_02_08_000052_create_payment_with_paypals_table',1),
(57,'2026_02_08_000053_create_payments_table',1),
(58,'2026_02_08_000054_create_payrolls_table',1),
(59,'2026_02_08_000055_create_pos_settings_table',1),
(60,'2026_02_08_000056_create_printers_table',1),
(61,'2026_02_08_000057_create_product_adjustments_table',1),
(62,'2026_02_08_000058_create_product_batches_table',1),
(63,'2026_02_08_000059_create_product_exchanges_table',1),
(64,'2026_02_08_000060_create_product_productions_table',1),
(65,'2026_02_08_000061_create_product_purchases_table',1),
(66,'2026_02_08_000062_create_product_quotations_table',1),
(67,'2026_02_08_000063_create_product_returns_table',1),
(68,'2026_02_08_000064_create_product_sales_table',1),
(69,'2026_02_08_000065_create_product_transfers_table',1),
(70,'2026_02_08_000066_create_product_variants_table',1),
(71,'2026_02_08_000067_create_product_warehouses_table',1),
(72,'2026_02_08_000068_create_productions_table',1),
(73,'2026_02_08_000069_create_products_table',1),
(74,'2026_02_08_000070_create_purchase_product_returns_table',1),
(75,'2026_02_08_000071_create_purchases_table',1),
(76,'2026_02_08_000072_create_quotations_table',1),
(77,'2026_02_08_000073_create_return_purchases_table',1),
(78,'2026_02_08_000074_create_returns_table',1),
(79,'2026_02_08_000075_create_reward_point_settings_table',1),
(80,'2026_02_08_000076_create_reward_points_table',1),
(81,'2026_02_08_000077_create_sale_exchanges_table',1),
(82,'2026_02_08_000078_create_sales_table',1),
(83,'2026_02_08_000079_create_shifts_table',1),
(84,'2026_02_08_000080_create_sms_templates_table',1),
(85,'2026_02_08_000081_create_stock_counts_table',1),
(86,'2026_02_08_000082_create_suppliers_table',1),
(87,'2026_02_08_000083_create_tables_table',1),
(88,'2026_02_08_000084_create_taxes_table',1),
(89,'2026_02_08_000085_create_transfers_table',1),
(90,'2026_02_08_000086_create_translations_table',1),
(91,'2026_02_08_000087_create_units_table',1),
(92,'2026_02_08_000088_add_fields_to_users_table',1),
(93,'2026_02_08_000089_create_variants_table',1),
(94,'2026_02_08_000090_create_warehouses_table',1),
(95,'2026_02_08_000091_create_whatsapp_settings_table',1),
(96,'2026_02_08_092850_create_permission_tables',1),
(97,'2026_02_08_101208_create_personal_access_tokens_table',1),
(98,'2026_02_08_114747_create_menus_table',1),
(99,'2026_02_08_114829_create_menu_role_table',1),
(100,'2026_02_08_000019_create_discounts_table',2),
(101,'2026_02_10_000001_add_description_to_roles_table',2),
(102,'2026_02_10_000020_ensure_admin_has_role_permissions',3);

/*Table structure for table `mobile_tokens` */

DROP TABLE IF EXISTS `mobile_tokens`;

CREATE TABLE `mobile_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `token` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `last_active` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `mobile_tokens` */

/*Table structure for table `model_has_permissions` */

DROP TABLE IF EXISTS `model_has_permissions`;

CREATE TABLE `model_has_permissions` (
  `permission_id` bigint unsigned NOT NULL,
  `model_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`permission_id`,`model_id`,`model_type`),
  KEY `model_has_permissions_model_id_model_type_index` (`model_id`,`model_type`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `model_has_permissions` */

/*Table structure for table `model_has_roles` */

DROP TABLE IF EXISTS `model_has_roles`;

CREATE TABLE `model_has_roles` (
  `role_id` bigint unsigned NOT NULL,
  `model_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`role_id`,`model_id`,`model_type`),
  KEY `model_has_roles_model_id_model_type_index` (`model_id`,`model_type`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `model_has_roles` */

insert  into `model_has_roles`(`role_id`,`model_type`,`model_id`) values 
(1,'App\\Models\\User',1);

/*Table structure for table `money_transfers` */

DROP TABLE IF EXISTS `money_transfers`;

CREATE TABLE `money_transfers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `reference_no` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `from_account_id` int NOT NULL,
  `to_account_id` int NOT NULL,
  `amount` double NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `money_transfers` */

/*Table structure for table `notifications` */

DROP TABLE IF EXISTS `notifications`;

CREATE TABLE `notifications` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notifiable_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notifiable_id` bigint unsigned NOT NULL,
  `data` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `notifications_notifiable_type_notifiable_id_index` (`notifiable_type`,`notifiable_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `notifications` */

/*Table structure for table `overtimes` */

DROP TABLE IF EXISTS `overtimes`;

CREATE TABLE `overtimes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` bigint unsigned NOT NULL,
  `date` date NOT NULL,
  `hours` decimal(5,2) NOT NULL,
  `rate` decimal(10,2) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `overtimes` */

/*Table structure for table `packing_slip_products` */

DROP TABLE IF EXISTS `packing_slip_products`;

CREATE TABLE `packing_slip_products` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `packing_slip_id` int NOT NULL,
  `product_id` int NOT NULL,
  `variant_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `packing_slip_products` */

/*Table structure for table `packing_slips` */

DROP TABLE IF EXISTS `packing_slips`;

CREATE TABLE `packing_slips` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `reference_no` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sale_id` int NOT NULL,
  `delivery_id` int DEFAULT NULL,
  `amount` double NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `packing_slips` */

/*Table structure for table `password_reset_tokens` */

DROP TABLE IF EXISTS `password_reset_tokens`;

CREATE TABLE `password_reset_tokens` (
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `password_reset_tokens` */

/*Table structure for table `payment_with_cheques` */

DROP TABLE IF EXISTS `payment_with_cheques`;

CREATE TABLE `payment_with_cheques` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `payment_id` int NOT NULL,
  `cheque_no` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `payment_with_cheques` */

/*Table structure for table `payment_with_credit_cards` */

DROP TABLE IF EXISTS `payment_with_credit_cards`;

CREATE TABLE `payment_with_credit_cards` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `payment_id` int NOT NULL,
  `customer_id` int DEFAULT NULL,
  `customer_stripe_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `charge_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `data` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `payment_with_credit_cards` */

/*Table structure for table `payment_with_gift_cards` */

DROP TABLE IF EXISTS `payment_with_gift_cards`;

CREATE TABLE `payment_with_gift_cards` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `payment_id` int NOT NULL,
  `gift_card_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `payment_with_gift_cards` */

/*Table structure for table `payment_with_paypals` */

DROP TABLE IF EXISTS `payment_with_paypals`;

CREATE TABLE `payment_with_paypals` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `payment_id` int NOT NULL,
  `transaction_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `payment_with_paypals` */

/*Table structure for table `payments` */

DROP TABLE IF EXISTS `payments`;

CREATE TABLE `payments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `payment_reference` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int NOT NULL,
  `purchase_id` int DEFAULT NULL,
  `sale_id` int DEFAULT NULL,
  `cash_register_id` int DEFAULT NULL,
  `account_id` int NOT NULL,
  `payment_receiver` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` double NOT NULL,
  `currency_id` bigint unsigned DEFAULT NULL,
  `installment_id` bigint unsigned DEFAULT NULL,
  `exchange_rate` decimal(8,2) NOT NULL,
  `payment_at` timestamp NULL DEFAULT NULL,
  `used_points` double DEFAULT NULL,
  `change` double DEFAULT NULL,
  `paying_method` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_note` text COLLATE utf8mb4_unicode_ci,
  `document` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `payments` */

/*Table structure for table `payrolls` */

DROP TABLE IF EXISTS `payrolls`;

CREATE TABLE `payrolls` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `reference_no` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employee_id` int NOT NULL,
  `account_id` int NOT NULL,
  `user_id` int NOT NULL,
  `amount` double NOT NULL,
  `paying_method` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount_array` json DEFAULT NULL,
  `month` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `payrolls` */

/*Table structure for table `permissions` */

DROP TABLE IF EXISTS `permissions`;

CREATE TABLE `permissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(125) COLLATE utf8mb4_unicode_ci NOT NULL,
  `guard_name` varchar(125) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_name_guard_name_unique` (`name`,`guard_name`)
) ENGINE=MyISAM AUTO_INCREMENT=240 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `permissions` */

insert  into `permissions`(`id`,`name`,`guard_name`,`created_at`,`updated_at`) values 
(1,'users.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(2,'users.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(3,'users.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(4,'users.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(5,'products.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(6,'products.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(7,'products.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(8,'products.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(9,'categories.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(10,'categories.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(11,'categories.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(12,'categories.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(13,'brands.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(14,'brands.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(15,'brands.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(16,'brands.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(17,'units.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(18,'units.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(19,'units.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(20,'units.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(21,'barcodes.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(22,'barcodes.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(23,'barcodes.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(24,'barcodes.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(25,'adjustments.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(26,'adjustments.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(27,'adjustments.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(28,'adjustments.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(29,'stock-counts.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(30,'stock-counts.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(31,'stock-counts.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(32,'stock-counts.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(33,'purchases.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(34,'purchases.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(35,'purchases.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(36,'purchases.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(37,'purchase-returns-view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(38,'purchase-returns-create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(39,'purchase-returns-edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(40,'purchase-returns-delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(41,'sales.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(42,'sales.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(43,'sales.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(44,'sales.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(45,'pos-view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(46,'pos-create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(47,'packing-slips.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(48,'packing-slips.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(49,'packing-slips.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(50,'packing-slips.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(51,'challans.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(52,'challans.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(53,'challans.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(54,'challans.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(55,'deliveries.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(56,'deliveries.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(57,'deliveries.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(58,'deliveries.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(59,'gift-cards.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(60,'gift-cards.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(61,'gift-cards.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(62,'gift-cards.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(63,'coupons.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(64,'coupons.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(65,'coupons.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(66,'coupons.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(67,'couriers.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(68,'couriers.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(69,'couriers.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(70,'couriers.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(71,'returns.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(72,'returns.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(73,'returns.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(74,'returns.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(75,'quotations.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(76,'quotations.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(77,'quotations.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(78,'quotations.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(79,'transfers.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(80,'transfers.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(81,'transfers.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(82,'transfers.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(83,'expenses.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(84,'expenses.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(85,'expenses.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(86,'expenses.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(87,'incomes.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(88,'incomes.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(89,'incomes.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(90,'incomes.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(91,'customers.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(92,'customers.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(93,'customers.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(94,'customers.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(95,'suppliers.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(96,'suppliers.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(97,'suppliers.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(98,'suppliers.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(99,'billers.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(100,'billers.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(101,'billers.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(102,'billers.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(103,'accounts.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(104,'accounts.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(105,'accounts.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(106,'accounts.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(107,'money-transfers.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(108,'money-transfers.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(109,'money-transfers.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(110,'money-transfers.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(111,'balance-sheets.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(112,'account-statements.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(113,'departments.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(114,'departments.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(115,'departments.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(116,'departments.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(117,'designations.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(118,'designations.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(119,'designations.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(120,'designations.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(121,'shifts.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(122,'shifts.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(123,'shifts.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(124,'shifts.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(125,'employees.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(126,'employees.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(127,'employees.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(128,'employees.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(129,'attendance.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(130,'attendance.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(131,'attendance.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(132,'attendance.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(133,'holidays.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(134,'holidays.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(135,'holidays.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(136,'holidays.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(137,'overtime.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(138,'overtime.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(139,'overtime.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(140,'overtime.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(141,'leave-types.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(142,'leave-types.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(143,'leave-types.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(144,'leave-types.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(145,'leaves.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(146,'leaves.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(147,'leaves.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(148,'leaves.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(149,'payrolls.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(150,'payrolls.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(151,'payrolls.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(152,'payrolls.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(153,'reports.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(154,'reports.export','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(155,'activity-logs.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(156,'printers.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(157,'printers.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(158,'printers.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(159,'printers.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(160,'invoice-settings.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(161,'invoice-settings.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(162,'role-permissions.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(163,'role-permissions.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(164,'sms-templates.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(165,'sms-templates.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(166,'sms-templates.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(167,'sms-templates.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(168,'custom-fields-view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(169,'custom-fields-create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(170,'custom-fields-edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(171,'custom-fields-delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(172,'discount-plans.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(173,'discount-plans.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(174,'discount-plans.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(175,'discount-plans.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(176,'discounts.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(177,'discounts.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(178,'discounts.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(179,'discounts.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(180,'notifications.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(181,'notifications.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(182,'notifications.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(183,'notifications.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(184,'warehouses-view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(185,'warehouses-create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(186,'warehouses-edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(187,'warehouses-delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(188,'tables.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(189,'tables.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(190,'tables.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(191,'tables.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(192,'customer-groups.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(193,'customer-groups.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(194,'customer-groups.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(195,'customer-groups.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(196,'currencies-view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(197,'currencies-create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(198,'currencies-edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(199,'currencies-delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(200,'taxes.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(201,'taxes.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(202,'taxes.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(203,'taxes.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(204,'user-profile.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(205,'user-profile.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(206,'general-settings.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(207,'general-settings.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(208,'mail-settings.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(209,'mail-settings.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(210,'reward-point-settings.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(211,'reward-point-settings.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(212,'sms-settings.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(213,'sms-settings.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(214,'payment-gateways.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(215,'payment-gateways.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(216,'pos-settings.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(217,'pos-settings.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(218,'hrm-settings.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(219,'hrm-settings.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(220,'barcode-settings.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(221,'barcode-settings.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(222,'languages.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(223,'languages.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(224,'languages.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(225,'languages.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(226,'backup-database.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(227,'backup-database.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(228,'payments.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(229,'payments.create','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(230,'payments.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(231,'payments.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(232,'menu.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(233,'menu.save','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(234,'menu.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(235,'menu.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(236,'category.view','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(237,'category.save','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(238,'category.edit','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11'),
(239,'category.delete','sanctum','2026-02-08 13:40:11','2026-02-08 13:40:11');

/*Table structure for table `personal_access_tokens` */

DROP TABLE IF EXISTS `personal_access_tokens`;

CREATE TABLE `personal_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint unsigned NOT NULL,
  `name` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=MyISAM AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `personal_access_tokens` */

insert  into `personal_access_tokens`(`id`,`tokenable_type`,`tokenable_id`,`name`,`token`,`abilities`,`last_used_at`,`expires_at`,`created_at`,`updated_at`) values 
(1,'App\\Models\\User',1,'authToken','05450e9e740613a57d5e7c83c7f6a8735eb59810c0cb16ced25ede3d868197a0','[\"*\"]','2026-02-08 14:01:09',NULL,'2026-02-08 13:41:44','2026-02-08 14:01:09'),
(2,'App\\Models\\User',1,'authToken','400a0d122cba613e47d02a78399219607eb53849a080432c99d1df709c13f7e9','[\"*\"]','2026-02-10 17:13:12',NULL,'2026-02-10 13:50:37','2026-02-10 17:13:12'),
(3,'App\\Models\\User',1,'authToken','7d48252ba0b45b0a98f625d0d7c6a0cb7d14bc2fea6fd9637d3fa8f8ae120fa4','[\"*\"]','2026-02-11 15:59:15',NULL,'2026-02-11 13:29:43','2026-02-11 15:59:15'),
(4,'App\\Models\\User',1,'authToken','b3d8efbfecb3618e6ada4a474bc2e51f832c3211cd420bd65438a02b6f49b63a','[\"*\"]',NULL,NULL,'2026-02-13 14:52:35','2026-02-13 14:52:35'),
(5,'App\\Models\\User',1,'authToken','73d8b702079fbcad308f3791036b71432dbd864569f6889f2f654c702c30a956','[\"*\"]',NULL,NULL,'2026-02-13 15:22:54','2026-02-13 15:22:54'),
(6,'App\\Models\\User',1,'authToken','29e6209a8370cef9ddcaab697978192cbc865b8ac4df65b5f398d17b0fdf4181','[\"*\"]',NULL,NULL,'2026-02-13 15:23:53','2026-02-13 15:23:53'),
(7,'App\\Models\\User',1,'authToken','a9da054a1d5249be24ef97f94638f5a3e4713c68c1fe2c3644b10c0a7d91d8df','[\"*\"]','2026-02-13 17:03:09',NULL,'2026-02-13 15:25:45','2026-02-13 17:03:09'),
(8,'App\\Models\\User',1,'authToken','207253cff82bf4096d47b8663d62b9a8cf6541518886cff165703fb292d33caa','[\"*\"]','2026-02-14 16:19:57',NULL,'2026-02-14 14:18:29','2026-02-14 16:19:57'),
(9,'App\\Models\\User',1,'authToken','4e9a4eab81152e3657653e192c1bd6a4bc4dec0c654a28e30104408d9c6ff0ab','[\"*\"]','2026-02-15 13:01:51',NULL,'2026-02-15 04:48:47','2026-02-15 13:01:51'),
(10,'App\\Models\\User',1,'authToken','007746a1fc175d77bc861f19ac94ca604d106f74e0439efa6aeaa35ea8aac7da','[\"*\"]','2026-02-17 16:53:46',NULL,'2026-02-17 13:20:48','2026-02-17 16:53:46'),
(11,'App\\Models\\User',1,'authToken','76b23ec04f851fbe96708487cf7cdbc75ac948600847dd94a91780856707270a','[\"*\"]','2026-02-18 15:15:33',NULL,'2026-02-18 14:17:50','2026-02-18 15:15:33'),
(12,'App\\Models\\User',1,'authToken','10b695e5620a3a95215a0a75fda168315e9b3785abfe0e9383c7d44bf7958072','[\"*\"]','2026-02-19 16:01:07',NULL,'2026-02-19 14:50:01','2026-02-19 16:01:07'),
(13,'App\\Models\\User',1,'authToken','f813fcdc3b18656b71cb784ff3e73afd254da4d77899d61d6121d31ae4bd94d9','[\"*\"]','2026-02-19 17:12:36',NULL,'2026-02-19 16:02:12','2026-02-19 17:12:36'),
(14,'App\\Models\\User',1,'authToken','6b7ad75bfb5046b4853e2d8a2ae960a2c6f88948ceebd436dc7660325700b44f','[\"*\"]','2026-02-21 16:32:59',NULL,'2026-02-21 03:52:43','2026-02-21 16:32:59');

/*Table structure for table `pos_settings` */

DROP TABLE IF EXISTS `pos_settings`;

CREATE TABLE `pos_settings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `warehouse_id` int NOT NULL,
  `biller_id` int NOT NULL,
  `product_number` int NOT NULL,
  `keybord_active` tinyint(1) NOT NULL,
  `is_table` tinyint(1) NOT NULL,
  `send_sms` tinyint(1) NOT NULL,
  `stripe_public_key` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stripe_secret_key` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paypal_live_api_username` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paypal_live_api_password` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paypal_live_api_secret` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_options` text COLLATE utf8mb4_unicode_ci,
  `show_print_invoice` tinyint(1) NOT NULL,
  `invoice_option` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `thermal_invoice_size` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cash_register` tinyint NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `pos_settings` */

/*Table structure for table `printers` */

DROP TABLE IF EXISTS `printers`;

CREATE TABLE `printers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `warehouse_id` int unsigned NOT NULL,
  `connection_type` enum('network','windows','linux') COLLATE utf8mb4_unicode_ci NOT NULL,
  `capability_profile` enum('default','simple','SP2000','TEP-200M','TM-U220','RP326','P822D') COLLATE utf8mb4_unicode_ci NOT NULL,
  `char_per_line` int NOT NULL,
  `ip_address` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `port` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `path` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` int unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `printers` */

/*Table structure for table `product_adjustments` */

DROP TABLE IF EXISTS `product_adjustments`;

CREATE TABLE `product_adjustments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `adjustment_id` int NOT NULL,
  `product_id` int NOT NULL,
  `variant_id` int DEFAULT NULL,
  `unit_cost` double DEFAULT NULL,
  `qty` double NOT NULL,
  `action` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `product_adjustments` */

/*Table structure for table `product_batches` */

DROP TABLE IF EXISTS `product_batches`;

CREATE TABLE `product_batches` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `batch_no` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expired_date` date NOT NULL,
  `qty` double NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `product_batches` */

/*Table structure for table `product_exchanges` */

DROP TABLE IF EXISTS `product_exchanges`;

CREATE TABLE `product_exchanges` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `exchange_id` int NOT NULL,
  `product_id` int NOT NULL,
  `qty` double NOT NULL,
  `sale_unit_id` int DEFAULT NULL,
  `net_unit_price` double NOT NULL,
  `discount` double NOT NULL,
  `tax_rate` double NOT NULL,
  `tax` double NOT NULL,
  `total` double NOT NULL,
  `type` enum('new','returned') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `product_exchanges` */

/*Table structure for table `product_productions` */

DROP TABLE IF EXISTS `product_productions`;

CREATE TABLE `product_productions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `production_id` int NOT NULL,
  `product_id` int NOT NULL,
  `qty` double NOT NULL,
  `recieved` double NOT NULL,
  `purchase_unit_id` int NOT NULL,
  `net_unit_cost` double NOT NULL,
  `tax_rate` double NOT NULL,
  `tax` double NOT NULL,
  `total` double NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `product_productions` */

/*Table structure for table `product_purchases` */

DROP TABLE IF EXISTS `product_purchases`;

CREATE TABLE `product_purchases` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `purchase_id` int NOT NULL,
  `product_id` int NOT NULL,
  `product_batch_id` int DEFAULT NULL,
  `variant_id` int DEFAULT NULL,
  `imei_number` text COLLATE utf8mb4_unicode_ci,
  `qty` double NOT NULL,
  `recieved` double NOT NULL,
  `return_qty` double NOT NULL,
  `purchase_unit_id` int NOT NULL,
  `net_unit_cost` double NOT NULL,
  `net_unit_margin` decimal(8,2) NOT NULL,
  `net_unit_margin_type` enum('flat','percentage') COLLATE utf8mb4_unicode_ci NOT NULL,
  `net_unit_price` decimal(8,2) NOT NULL,
  `discount` double NOT NULL,
  `tax_rate` double NOT NULL,
  `tax` double NOT NULL,
  `total` double NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `product_purchases` */

/*Table structure for table `product_quotations` */

DROP TABLE IF EXISTS `product_quotations`;

CREATE TABLE `product_quotations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `quotation_id` int NOT NULL,
  `product_id` int NOT NULL,
  `product_batch_id` int DEFAULT NULL,
  `variant_id` int DEFAULT NULL,
  `qty` double NOT NULL,
  `sale_unit_id` int NOT NULL,
  `net_unit_price` double NOT NULL,
  `discount` double NOT NULL,
  `tax_rate` double NOT NULL,
  `tax` double NOT NULL,
  `total` double NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `product_quotations` */

/*Table structure for table `product_returns` */

DROP TABLE IF EXISTS `product_returns`;

CREATE TABLE `product_returns` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `return_id` int NOT NULL,
  `product_id` int NOT NULL,
  `product_batch_id` int DEFAULT NULL,
  `variant_id` int DEFAULT NULL,
  `imei_number` text COLLATE utf8mb4_unicode_ci,
  `qty` double NOT NULL,
  `sale_unit_id` int NOT NULL,
  `net_unit_price` double NOT NULL,
  `discount` double NOT NULL,
  `tax_rate` double NOT NULL,
  `tax` double NOT NULL,
  `total` double NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `product_returns` */

/*Table structure for table `product_sales` */

DROP TABLE IF EXISTS `product_sales`;

CREATE TABLE `product_sales` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `sale_id` int NOT NULL,
  `product_id` int NOT NULL,
  `product_batch_id` int DEFAULT NULL,
  `variant_id` int DEFAULT NULL,
  `imei_number` text COLLATE utf8mb4_unicode_ci,
  `qty` double NOT NULL,
  `return_qty` double NOT NULL,
  `sale_unit_id` int NOT NULL,
  `net_unit_price` double NOT NULL,
  `discount` double NOT NULL,
  `tax_rate` double NOT NULL,
  `tax` double NOT NULL,
  `total` double NOT NULL,
  `is_delivered` tinyint(1) DEFAULT NULL,
  `is_packing` tinyint(1) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `product_sales` */

/*Table structure for table `product_transfers` */

DROP TABLE IF EXISTS `product_transfers`;

CREATE TABLE `product_transfers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `transfer_id` int NOT NULL,
  `product_id` int NOT NULL,
  `product_batch_id` int DEFAULT NULL,
  `variant_id` int DEFAULT NULL,
  `imei_number` text COLLATE utf8mb4_unicode_ci,
  `qty` double NOT NULL,
  `purchase_unit_id` int NOT NULL,
  `net_unit_cost` double NOT NULL,
  `tax_rate` double NOT NULL,
  `tax` double NOT NULL,
  `total` double NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `product_transfers` */

/*Table structure for table `product_variants` */

DROP TABLE IF EXISTS `product_variants`;

CREATE TABLE `product_variants` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `variant_id` int NOT NULL,
  `position` int NOT NULL,
  `item_code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `additional_cost` double DEFAULT NULL,
  `additional_price` double DEFAULT NULL,
  `qty` double NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `product_variants` */

insert  into `product_variants`(`id`,`product_id`,`variant_id`,`position`,`item_code`,`additional_cost`,`additional_price`,`qty`,`created_at`,`updated_at`) values 
(10,1,3,2,'S-30YYYWE8O3',10,50,0,'2026-02-21 06:28:37','2026-02-21 06:28:37'),
(11,1,2,3,'L-30YYYWE8O3',15,50,0,'2026-02-21 06:28:37','2026-02-21 06:28:37'),
(9,1,1,1,'M-30YYYWE8O3',10,50,0,'2026-02-21 06:28:37','2026-02-21 06:28:37');

/*Table structure for table `product_warehouses` */

DROP TABLE IF EXISTS `product_warehouses`;

CREATE TABLE `product_warehouses` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_batch_id` int DEFAULT NULL,
  `variant_id` int DEFAULT NULL,
  `imei_number` text COLLATE utf8mb4_unicode_ci,
  `warehouse_id` int NOT NULL,
  `qty` double NOT NULL,
  `price` double DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `product_warehouses` */

insert  into `product_warehouses`(`id`,`product_id`,`product_batch_id`,`variant_id`,`imei_number`,`warehouse_id`,`qty`,`price`,`created_at`,`updated_at`) values 
(1,'1',NULL,NULL,NULL,3,0,NULL,'2026-02-10 17:13:12','2026-02-10 17:13:12'),
(2,'2',NULL,NULL,NULL,1,10,2000,'2026-02-21 06:54:22','2026-02-21 08:59:59'),
(3,'2',NULL,NULL,NULL,2,5,2100,'2026-02-21 06:54:22','2026-02-21 09:03:39'),
(4,'2',NULL,NULL,NULL,3,3,2200,'2026-02-21 06:54:22','2026-02-21 09:03:39');

/*Table structure for table `productions` */

DROP TABLE IF EXISTS `productions`;

CREATE TABLE `productions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `reference_no` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `warehouse_id` int NOT NULL,
  `user_id` int NOT NULL,
  `item` int NOT NULL,
  `total_qty` int NOT NULL,
  `total_tax` double NOT NULL,
  `total_cost` double NOT NULL,
  `shipping_cost` double DEFAULT NULL,
  `production_cost` double DEFAULT NULL,
  `grand_total` double NOT NULL,
  `status` int NOT NULL,
  `document` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `production_units_ids` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `wastage_percent` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `product_list` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `product_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qty_list` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price_list` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `productions` */

/*Table structure for table `products` */

DROP TABLE IF EXISTS `products`;

CREATE TABLE `products` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `alt_code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `barcode_symbology` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `brand_id` int DEFAULT NULL,
  `category_id` int NOT NULL,
  `unit_id` int NOT NULL,
  `purchase_unit_id` int NOT NULL,
  `sale_unit_id` int NOT NULL,
  `cost` double NOT NULL,
  `price` double NOT NULL,
  `profit_margin` decimal(8,2) NOT NULL,
  `profit_margin_type` enum('flat','percentage') COLLATE utf8mb4_unicode_ci NOT NULL,
  `wholesale_price` double DEFAULT NULL,
  `qty` double DEFAULT NULL,
  `alert_quantity` double DEFAULT NULL,
  `daily_sale_objective` double DEFAULT NULL,
  `promotion` tinyint DEFAULT NULL,
  `promotion_price` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `starting_date` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_date` date DEFAULT NULL,
  `tax_id` int DEFAULT NULL,
  `tax_method` int DEFAULT NULL,
  `image` longtext COLLATE utf8mb4_unicode_ci,
  `file` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_embeded` tinyint(1) DEFAULT NULL,
  `is_variant` tinyint(1) DEFAULT NULL,
  `is_batch` tinyint(1) DEFAULT NULL,
  `is_diffPrice` tinyint(1) DEFAULT NULL,
  `is_imei` tinyint(1) DEFAULT NULL,
  `featured` tinyint DEFAULT NULL,
  `product_list` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `variant_list` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qty_list` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price_list` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `product_details` text COLLATE utf8mb4_unicode_ci,
  `variant_option` text COLLATE utf8mb4_unicode_ci,
  `variant_value` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) DEFAULT NULL,
  `guarantee` int DEFAULT NULL,
  `warranty` int DEFAULT NULL,
  `guarantee_type` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `warranty_type` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `wastage_percent` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `combo_unit_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `production_cost` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_recipe` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `products` */

insert  into `products`(`id`,`name`,`code`,`alt_code`,`type`,`barcode_symbology`,`brand_id`,`category_id`,`unit_id`,`purchase_unit_id`,`sale_unit_id`,`cost`,`price`,`profit_margin`,`profit_margin_type`,`wholesale_price`,`qty`,`alert_quantity`,`daily_sale_objective`,`promotion`,`promotion_price`,`starting_date`,`last_date`,`tax_id`,`tax_method`,`image`,`file`,`is_embeded`,`is_variant`,`is_batch`,`is_diffPrice`,`is_imei`,`featured`,`product_list`,`variant_list`,`qty_list`,`price_list`,`product_details`,`variant_option`,`variant_value`,`is_active`,`guarantee`,`warranty`,`guarantee_type`,`warranty_type`,`wastage_percent`,`combo_unit_id`,`production_cost`,`is_recipe`,`created_at`,`updated_at`) values 
(1,'2T OIL','30YYYWE8O3','IZFC','standard','C128',1,1,1,1,1,1200,1500,0.00,'percentage',NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,1,'zummXD2dvAtI.png',NULL,0,1,0,0,0,0,NULL,NULL,NULL,NULL,NULL,'[\"Size\"]','[\"S,M,L\"]',1,NULL,NULL,NULL,NULL,'0',NULL,'0',0,'2026-02-10 15:39:40','2026-02-21 05:25:40'),
(2,'dfgfdgfg hjghjh xdgdfgf','WWHH42JTCK','OK6M57OQV6','standard','C128',2,1,1,1,1,1499,1873.75,25.00,'percentage',NULL,18,NULL,NULL,0,NULL,NULL,NULL,NULL,1,'zummXD2dvAtI.png',NULL,0,0,0,1,0,0,NULL,NULL,NULL,NULL,'dfdfd hffhfgh srewrr dfgfgff dgdddfgdf rdfgdfgfg',NULL,NULL,1,NULL,NULL,NULL,NULL,'0',NULL,'0',0,'2026-02-21 06:54:22','2026-02-21 09:03:39'),
(3,'bat ch esdf','LWTWJ33LCJ','NM2G5EO6RD','standard','C128',1,1,1,1,1,1400,1750,25.00,'percentage',NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,1,'zummXD2dvAtI.png',NULL,0,0,1,0,0,0,NULL,NULL,NULL,NULL,'dff fgfg dorri  fifugfg zoiisjpdjfdjfpoii dfzgdfgfg',NULL,NULL,1,NULL,NULL,NULL,NULL,'0',NULL,'0',0,'2026-02-21 09:07:37','2026-02-21 09:07:37'),
(4,'serilfg df','8Z7ISJDJPC','HLAYX9OLLZ','standard','C128',2,1,1,1,1,1250,1562.5,25.00,'percentage',NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,1,'zummXD2dvAtI.png',NULL,0,0,0,0,1,0,NULL,NULL,NULL,NULL,'dd gj rtrtsrt fgh f ghh',NULL,NULL,1,NULL,NULL,NULL,NULL,'0',NULL,'0',0,'2026-02-21 09:13:52','2026-02-21 09:13:52');

/*Table structure for table `purchase_product_returns` */

DROP TABLE IF EXISTS `purchase_product_returns`;

CREATE TABLE `purchase_product_returns` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `return_id` int NOT NULL,
  `product_id` int NOT NULL,
  `product_batch_id` int DEFAULT NULL,
  `variant_id` int DEFAULT NULL,
  `imei_number` text COLLATE utf8mb4_unicode_ci,
  `qty` double NOT NULL,
  `purchase_unit_id` int NOT NULL,
  `net_unit_cost` double NOT NULL,
  `discount` double NOT NULL,
  `tax_rate` double NOT NULL,
  `tax` double NOT NULL,
  `total` double NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `purchase_product_returns` */

/*Table structure for table `purchases` */

DROP TABLE IF EXISTS `purchases`;

CREATE TABLE `purchases` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `reference_no` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int NOT NULL,
  `warehouse_id` int NOT NULL,
  `supplier_id` int DEFAULT NULL,
  `currency_id` int DEFAULT NULL,
  `exchange_rate` double DEFAULT NULL,
  `item` int NOT NULL,
  `total_qty` double NOT NULL,
  `total_discount` double NOT NULL,
  `total_tax` double NOT NULL,
  `total_cost` double NOT NULL,
  `order_tax_rate` double DEFAULT NULL,
  `order_tax` double DEFAULT NULL,
  `order_discount` double DEFAULT NULL,
  `shipping_cost` double DEFAULT NULL,
  `grand_total` double NOT NULL,
  `paid_amount` double NOT NULL,
  `status` int NOT NULL,
  `payment_status` int NOT NULL,
  `document` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `purchase_type` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_by` int unsigned DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `purchases` */

/*Table structure for table `quotations` */

DROP TABLE IF EXISTS `quotations`;

CREATE TABLE `quotations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `reference_no` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int NOT NULL,
  `biller_id` int NOT NULL,
  `supplier_id` int DEFAULT NULL,
  `customer_id` int NOT NULL,
  `warehouse_id` int NOT NULL,
  `item` int NOT NULL,
  `total_qty` double NOT NULL,
  `total_discount` double NOT NULL,
  `total_tax` double NOT NULL,
  `total_price` double NOT NULL,
  `order_tax_rate` double DEFAULT NULL,
  `order_tax` double DEFAULT NULL,
  `order_discount` double DEFAULT NULL,
  `shipping_cost` double DEFAULT NULL,
  `grand_total` double NOT NULL,
  `quotation_status` int NOT NULL,
  `document` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `quotations` */

/*Table structure for table `return_purchases` */

DROP TABLE IF EXISTS `return_purchases`;

CREATE TABLE `return_purchases` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `reference_no` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `supplier_id` int DEFAULT NULL,
  `warehouse_id` int NOT NULL,
  `user_id` int NOT NULL,
  `purchase_id` int DEFAULT NULL,
  `account_id` int NOT NULL,
  `currency_id` int DEFAULT NULL,
  `exchange_rate` double DEFAULT NULL,
  `item` int NOT NULL,
  `total_qty` double NOT NULL,
  `total_discount` double NOT NULL,
  `total_tax` double NOT NULL,
  `total_cost` double NOT NULL,
  `order_tax_rate` double DEFAULT NULL,
  `order_tax` double DEFAULT NULL,
  `grand_total` double NOT NULL,
  `document` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `return_note` text COLLATE utf8mb4_unicode_ci,
  `staff_note` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `return_purchases` */

/*Table structure for table `returns` */

DROP TABLE IF EXISTS `returns`;

CREATE TABLE `returns` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `reference_no` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int NOT NULL,
  `sale_id` int DEFAULT NULL,
  `cash_register_id` int DEFAULT NULL,
  `customer_id` int NOT NULL,
  `warehouse_id` int NOT NULL,
  `biller_id` int NOT NULL,
  `account_id` int NOT NULL,
  `currency_id` int DEFAULT NULL,
  `exchange_rate` double DEFAULT NULL,
  `item` int NOT NULL,
  `total_qty` double NOT NULL,
  `total_discount` double NOT NULL,
  `total_tax` double NOT NULL,
  `total_price` double NOT NULL,
  `order_tax_rate` double DEFAULT NULL,
  `order_tax` double DEFAULT NULL,
  `grand_total` double NOT NULL,
  `document` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `return_note` text COLLATE utf8mb4_unicode_ci,
  `staff_note` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `returns` */

/*Table structure for table `reward_point_settings` */

DROP TABLE IF EXISTS `reward_point_settings`;

CREATE TABLE `reward_point_settings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `per_point_amount` double NOT NULL,
  `minimum_amount` double NOT NULL,
  `duration` int DEFAULT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `redeem_amount_per_unit_rp` decimal(10,2) DEFAULT NULL,
  `min_order_total_for_redeem` decimal(10,2) DEFAULT NULL,
  `min_redeem_point` int DEFAULT NULL,
  `max_redeem_point` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `reward_point_settings` */

/*Table structure for table `reward_points` */

DROP TABLE IF EXISTS `reward_points`;

CREATE TABLE `reward_points` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `customer_id` bigint unsigned NOT NULL,
  `reward_point_type` enum('manual','automatic') COLLATE utf8mb4_unicode_ci NOT NULL,
  `points` decimal(8,2) NOT NULL,
  `deducted_points` decimal(8,2) NOT NULL,
  `note` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expired_at` datetime DEFAULT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `updated_by` bigint unsigned DEFAULT NULL,
  `sale_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `reward_points` */

/*Table structure for table `role_has_permissions` */

DROP TABLE IF EXISTS `role_has_permissions`;

CREATE TABLE `role_has_permissions` (
  `permission_id` bigint unsigned NOT NULL,
  `role_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`permission_id`,`role_id`),
  KEY `role_has_permissions_role_id_foreign` (`role_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `role_has_permissions` */

insert  into `role_has_permissions`(`permission_id`,`role_id`) values 
(1,1),
(1,2),
(2,1),
(2,2),
(3,1),
(3,2),
(4,1),
(4,2),
(5,1),
(5,2),
(5,3),
(5,4),
(5,5),
(5,6),
(6,1),
(6,2),
(6,3),
(6,6),
(7,1),
(7,2),
(7,3),
(7,6),
(8,1),
(8,2),
(9,1),
(9,2),
(9,3),
(9,6),
(10,1),
(10,2),
(10,3),
(10,6),
(11,1),
(11,2),
(11,3),
(11,6),
(12,1),
(12,2),
(13,1),
(13,2),
(14,1),
(14,2),
(15,1),
(15,2),
(16,1),
(16,2),
(17,1),
(18,1),
(19,1),
(20,1),
(21,1),
(22,1),
(23,1),
(24,1),
(25,1),
(25,2),
(25,3),
(25,6),
(26,1),
(26,2),
(26,3),
(26,6),
(27,1),
(27,2),
(27,6),
(28,1),
(28,2),
(29,1),
(30,1),
(31,1),
(32,1),
(33,1),
(33,2),
(33,3),
(33,6),
(34,1),
(34,2),
(34,3),
(34,6),
(35,1),
(35,2),
(35,3),
(35,6),
(36,1),
(36,2),
(37,1),
(38,1),
(39,1),
(40,1),
(41,1),
(41,2),
(41,3),
(41,4),
(41,5),
(42,1),
(42,2),
(42,3),
(42,4),
(42,5),
(43,1),
(43,2),
(43,3),
(43,5),
(44,1),
(44,2),
(45,1),
(46,1),
(47,1),
(48,1),
(49,1),
(50,1),
(51,1),
(52,1),
(53,1),
(54,1),
(55,1),
(56,1),
(57,1),
(58,1),
(59,1),
(60,1),
(61,1),
(62,1),
(63,1),
(64,1),
(65,1),
(66,1),
(67,1),
(68,1),
(69,1),
(70,1),
(71,1),
(71,2),
(71,3),
(71,4),
(71,5),
(72,1),
(72,2),
(72,3),
(72,4),
(72,5),
(73,1),
(73,2),
(74,1),
(74,2),
(75,1),
(75,2),
(75,3),
(75,4),
(75,5),
(76,1),
(76,2),
(76,3),
(76,4),
(76,5),
(77,1),
(77,2),
(77,3),
(77,5),
(78,1),
(78,2),
(79,1),
(79,2),
(79,3),
(79,6),
(80,1),
(80,2),
(80,3),
(80,6),
(81,1),
(81,2),
(81,6),
(82,1),
(82,2),
(83,1),
(83,2),
(83,3),
(83,7),
(84,1),
(84,2),
(84,3),
(84,7),
(85,1),
(85,2),
(85,7),
(86,1),
(86,2),
(87,1),
(87,7),
(88,1),
(88,7),
(89,1),
(89,7),
(90,1),
(91,1),
(91,2),
(91,3),
(91,4),
(91,5),
(92,1),
(92,2),
(92,3),
(92,5),
(93,1),
(93,2),
(93,3),
(93,5),
(94,1),
(94,2),
(95,1),
(95,2),
(95,3),
(95,6),
(96,1),
(96,2),
(96,3),
(97,1),
(97,2),
(97,3),
(98,1),
(98,2),
(99,1),
(100,1),
(101,1),
(102,1),
(103,1),
(103,7),
(104,1),
(104,7),
(105,1),
(105,7),
(106,1),
(107,1),
(107,7),
(108,1),
(108,7),
(109,1),
(109,7),
(110,1),
(111,1),
(112,1),
(113,1),
(114,1),
(115,1),
(116,1),
(117,1),
(118,1),
(119,1),
(120,1),
(121,1),
(122,1),
(123,1),
(124,1),
(125,1),
(126,1),
(127,1),
(128,1),
(129,1),
(130,1),
(131,1),
(132,1),
(133,1),
(134,1),
(135,1),
(136,1),
(137,1),
(138,1),
(139,1),
(140,1),
(141,1),
(142,1),
(143,1),
(144,1),
(145,1),
(146,1),
(147,1),
(148,1),
(149,1),
(150,1),
(151,1),
(152,1),
(153,1),
(153,2),
(153,3),
(153,7),
(154,1),
(154,2),
(154,7),
(155,1),
(156,1),
(157,1),
(158,1),
(159,1),
(160,1),
(161,1),
(162,1),
(162,2),
(163,1),
(163,2),
(164,1),
(165,1),
(166,1),
(167,1),
(168,1),
(169,1),
(170,1),
(171,1),
(172,1),
(173,1),
(174,1),
(175,1),
(176,1),
(177,1),
(178,1),
(179,1),
(180,1),
(181,1),
(182,1),
(183,1),
(184,1),
(185,1),
(186,1),
(187,1),
(188,1),
(189,1),
(190,1),
(191,1),
(192,1),
(193,1),
(194,1),
(195,1),
(196,1),
(197,1),
(198,1),
(199,1),
(200,1),
(201,1),
(202,1),
(203,1),
(204,1),
(205,1),
(206,1),
(207,1),
(208,1),
(209,1),
(210,1),
(211,1),
(212,1),
(213,1),
(214,1),
(215,1),
(216,1),
(217,1),
(218,1),
(219,1),
(220,1),
(221,1),
(222,1),
(223,1),
(224,1),
(225,1),
(226,1),
(227,1),
(228,1),
(228,2),
(228,3),
(228,4),
(228,7),
(229,1),
(229,2),
(229,3),
(229,4),
(229,7),
(230,1),
(230,2),
(230,7),
(231,1),
(231,2),
(232,1),
(232,2),
(233,1),
(233,2),
(234,1),
(234,2),
(235,1),
(235,2),
(236,1),
(236,2),
(236,3),
(236,6),
(237,1),
(237,2),
(237,3),
(237,6),
(238,1),
(238,2),
(238,3),
(238,6),
(239,1),
(239,2);

/*Table structure for table `roles` */

DROP TABLE IF EXISTS `roles`;

CREATE TABLE `roles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(125) COLLATE utf8mb4_unicode_ci NOT NULL,
  `guard_name` varchar(125) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_name_guard_name_unique` (`name`,`guard_name`)
) ENGINE=MyISAM AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `roles` */

insert  into `roles`(`id`,`name`,`guard_name`,`description`,`created_at`,`updated_at`) values 
(1,'super-admin','sanctum',NULL,'2026-02-08 13:40:11','2026-02-08 13:40:11'),
(2,'admin','sanctum',NULL,'2026-02-08 13:40:11','2026-02-08 13:40:11'),
(3,'manager','sanctum',NULL,'2026-02-08 13:40:11','2026-02-08 13:40:11'),
(4,'cashier','sanctum',NULL,'2026-02-08 13:40:11','2026-02-08 13:40:11'),
(5,'sales-person','sanctum',NULL,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(6,'warehouse-manager','sanctum',NULL,'2026-02-08 13:40:12','2026-02-08 13:40:12'),
(7,'accountant','sanctum',NULL,'2026-02-08 13:40:12','2026-02-08 13:40:12');

/*Table structure for table `sale_exchanges` */

DROP TABLE IF EXISTS `sale_exchanges`;

CREATE TABLE `sale_exchanges` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `sale_id` int NOT NULL,
  `reference_no` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` int NOT NULL,
  `user_id` int NOT NULL,
  `warehouse_id` int NOT NULL,
  `biller_id` int NOT NULL,
  `item` int NOT NULL,
  `total_qty` double NOT NULL,
  `total_discount` double NOT NULL,
  `total_tax` double NOT NULL,
  `amount` double NOT NULL,
  `payment_type` enum('pay','receive') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `order_tax_rate` double DEFAULT NULL,
  `order_tax` double DEFAULT NULL,
  `grand_total` double NOT NULL,
  `document` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `exchange_note` text COLLATE utf8mb4_unicode_ci,
  `staff_note` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `sale_exchanges` */

/*Table structure for table `sales` */

DROP TABLE IF EXISTS `sales`;

CREATE TABLE `sales` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `reference_no` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int NOT NULL,
  `cash_register_id` int DEFAULT NULL,
  `table_id` int DEFAULT NULL,
  `queue` int DEFAULT NULL,
  `customer_id` int NOT NULL,
  `warehouse_id` int NOT NULL,
  `biller_id` int DEFAULT NULL,
  `item` int NOT NULL,
  `total_qty` double NOT NULL,
  `total_discount` double NOT NULL,
  `total_tax` double NOT NULL,
  `total_price` double NOT NULL,
  `grand_total` double NOT NULL,
  `currency_id` int DEFAULT NULL,
  `exchange_rate` double DEFAULT NULL,
  `order_tax_rate` double DEFAULT NULL,
  `order_tax` double DEFAULT NULL,
  `order_discount_type` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `order_discount_value` double DEFAULT NULL,
  `order_discount` double DEFAULT NULL,
  `coupon_id` int DEFAULT NULL,
  `coupon_discount` double DEFAULT NULL,
  `shipping_cost` double DEFAULT NULL,
  `sale_status` int NOT NULL,
  `payment_status` int NOT NULL,
  `document` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paid_amount` double DEFAULT NULL,
  `sale_note` text COLLATE utf8mb4_unicode_ci,
  `staff_note` text COLLATE utf8mb4_unicode_ci,
  `sale_type` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_by` int unsigned DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `sales` */

/*Table structure for table `sessions` */

DROP TABLE IF EXISTS `sessions`;

CREATE TABLE `sessions` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `sessions` */

insert  into `sessions`(`id`,`user_id`,`ip_address`,`user_agent`,`payload`,`last_activity`) values 
('g4qksXocOhPbeFM4rqQSt2TPqEi0NVdNbsVplWdf',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiS1gzTjIwSE5lR2t0MThjM1hlSmdaTDRTOGFhRk1OTnR0Y1h2YmNoYiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1770994461),
('FxBFEVzvHDLx715njVUHxk4HeoPSmPe6AITXFA7A',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoidW9QUFBMNFp1NnVxMXd4WTdwWXlST2ZRbXlMRGVrUGJLeDdzYTBVbiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMCI7czo1OiJyb3V0ZSI7czoyNzoiZ2VuZXJhdGVkOjpuTTRKSWQ2Nk91MzZYRk5DIjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1771134965),
('slsfiRNSZ5t3P3adMYpi5IIgKQGGMqbHVOEQvM48',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiOEJLNzA4MXJhQUVVM1V1cUZ2b2JrVXFOOWJ5RHJYblJmZDhKcGtOZyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMCI7czo1OiJyb3V0ZSI7czoyNzoiZ2VuZXJhdGVkOjpuTTRKSWQ2Nk91MzZYRk5DIjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1771338533),
('bcczh7UJWJ1EA2RQBVbNqmZKcEn5kR1GJkDudjSC',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiSkFpODZsN053UG1YelRxYlZWb0pZN01QdW8zVktRVnhTREljNFFpbSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMCI7czo1OiJyb3V0ZSI7czoyNzoiZ2VuZXJhdGVkOjpuTTRKSWQ2Nk91MzZYRk5DIjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1771514109);

/*Table structure for table `shifts` */

DROP TABLE IF EXISTS `shifts`;

CREATE TABLE `shifts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `grace_in` int NOT NULL COMMENT 'Grace period (minutes) before marking late',
  `grace_out` int NOT NULL COMMENT 'Grace period (minutes) before marking early leave',
  `total_hours` decimal(5,2) DEFAULT NULL COMMENT 'Total working hours for the shift',
  `is_active` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `shifts` */

/*Table structure for table `sms_templates` */

DROP TABLE IF EXISTS `sms_templates`;

CREATE TABLE `sms_templates` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_default` tinyint(1) NOT NULL,
  `is_default_ecommerce` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `sms_templates` */

/*Table structure for table `stock_counts` */

DROP TABLE IF EXISTS `stock_counts`;

CREATE TABLE `stock_counts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `reference_no` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `warehouse_id` int NOT NULL,
  `category_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `brand_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` int NOT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `initial_file` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `final_file` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `is_adjusted` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `stock_counts` */

/*Table structure for table `suppliers` */

DROP TABLE IF EXISTS `suppliers`;

CREATE TABLE `suppliers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company_name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vat_number` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone_number` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `wa_number` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `postal_code` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `opening_balance` double NOT NULL DEFAULT '0',
  `pay_term_no` int DEFAULT NULL,
  `pay_term_period` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `suppliers` */

/*Table structure for table `tables` */

DROP TABLE IF EXISTS `tables`;

CREATE TABLE `tables` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `number_of_person` int DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `floor_id` tinyint NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `tables` */

/*Table structure for table `taxes` */

DROP TABLE IF EXISTS `taxes`;

CREATE TABLE `taxes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rate` double NOT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `taxes` */

/*Table structure for table `transfers` */

DROP TABLE IF EXISTS `transfers`;

CREATE TABLE `transfers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `reference_no` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int NOT NULL,
  `status` int NOT NULL,
  `from_warehouse_id` int NOT NULL,
  `to_warehouse_id` int NOT NULL,
  `item` int NOT NULL,
  `total_qty` double NOT NULL,
  `total_tax` double NOT NULL,
  `total_cost` double NOT NULL,
  `shipping_cost` double DEFAULT NULL,
  `grand_total` double NOT NULL,
  `document` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `is_sent` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `transfers` */

/*Table structure for table `translations` */

DROP TABLE IF EXISTS `translations`;

CREATE TABLE `translations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `locale` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `group` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `key` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `translations` */

/*Table structure for table `units` */

DROP TABLE IF EXISTS `units`;

CREATE TABLE `units` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `unit_code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `base_unit` int DEFAULT NULL,
  `operator` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `operation_value` double DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `units` */

insert  into `units`(`id`,`unit_code`,`unit_name`,`base_unit`,`operator`,`operation_value`,`is_active`,`created_at`,`updated_at`) values 
(1,'pc','piece',NULL,'*',1,1,'2026-02-10 14:15:02','2026-02-10 14:15:02');

/*Table structure for table `users` */

DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `account_id` int unsigned DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role_id` int NOT NULL,
  `biller_id` int DEFAULT NULL,
  `warehouse_id` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_username_unique` (`username`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `users` */

insert  into `users`(`id`,`account_id`,`name`,`username`,`email`,`email_verified_at`,`password`,`phone`,`company_name`,`role_id`,`biller_id`,`warehouse_id`,`is_active`,`is_deleted`,`remember_token`,`created_at`,`updated_at`) values 
(1,NULL,'Super Admin','admin','admin@example.com',NULL,'$2y$12$7w3.xmeFHtmIOLVsyDbFQ.rBmLKaf6hi04V3.EgRjCCXmJybPyUSS','1234567890',NULL,1,NULL,NULL,1,0,NULL,'2026-02-08 13:40:12','2026-02-08 13:40:12');

/*Table structure for table `variants` */

DROP TABLE IF EXISTS `variants`;

CREATE TABLE `variants` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `variants` */

insert  into `variants`(`id`,`name`,`created_at`,`updated_at`) values 
(1,'M','2026-02-10 15:39:40','2026-02-10 15:39:40'),
(2,'L','2026-02-10 15:39:41','2026-02-10 15:39:41'),
(3,'S','2026-02-21 05:25:40','2026-02-21 05:25:40');

/*Table structure for table `warehouses` */

DROP TABLE IF EXISTS `warehouses`;

CREATE TABLE `warehouses` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `warehouses` */

insert  into `warehouses`(`id`,`name`,`phone`,`email`,`address`,`is_active`,`created_at`,`updated_at`) values 
(1,'test','0123456789',NULL,'fddfdf dfdff',1,'2026-02-10 17:10:09','2026-02-10 17:10:09'),
(2,'test d','0123456789',NULL,'fddfdf dfdff',1,'2026-02-10 17:10:24','2026-02-10 17:10:24'),
(3,'test ds','0123456789',NULL,'fddfdf dfdff',1,'2026-02-10 17:13:12','2026-02-10 17:13:12');

/*Table structure for table `whatsapp_settings` */

DROP TABLE IF EXISTS `whatsapp_settings`;

CREATE TABLE `whatsapp_settings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `phone_number_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `business_account_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `permanent_access_token` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `whatsapp_settings` */

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
