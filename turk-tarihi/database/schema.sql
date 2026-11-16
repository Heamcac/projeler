CREATE TABLE admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(80) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE states (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(180) NOT NULL,
    slug VARCHAR(190) NOT NULL UNIQUE,
    short_description TEXT,
    description MEDIUMTEXT,
    start_year INT,
    end_year INT NULL,
    capital VARCHAR(180),
    founder VARCHAR(180),
    government VARCHAR(180),
    religion VARCHAR(180),
    region VARCHAR(180),
    flag_image VARCHAR(500),
    symbol_image VARCHAR(500),
    map_image VARCHAR(500),
    hero_image VARCHAR(500),
    status VARCHAR(40) DEFAULT 'published',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_states_slug (slug),
    INDEX idx_states_year (start_year),
    INDEX idx_states_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE rulers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    state_id INT NOT NULL,
    name VARCHAR(180) NOT NULL,
    slug VARCHAR(190) NOT NULL UNIQUE,
    birth_year INT NULL,
    death_year INT NULL,
    reign_start INT NULL,
    reign_end INT NULL,
    biography MEDIUMTEXT,
    achievements MEDIUMTEXT,
    image VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_rulers_state FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE CASCADE,
    INDEX idx_rulers_slug (slug),
    INDEX idx_rulers_state (state_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE wars (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(180) NOT NULL,
    slug VARCHAR(190) NOT NULL UNIQUE,
    date_text VARCHAR(120),
    year INT,
    location VARCHAR(180),
    result VARCHAR(255),
    description MEDIUMTEXT,
    background MEDIUMTEXT,
    battle MEDIUMTEXT,
    aftermath MEDIUMTEXT,
    importance MEDIUMTEXT,
    map_image VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_wars_slug (slug),
    INDEX idx_wars_year (year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE state_wars (
    state_id INT NOT NULL,
    war_id INT NOT NULL,
    PRIMARY KEY (state_id, war_id),
    CONSTRAINT fk_state_wars_state FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE CASCADE,
    CONSTRAINT fk_state_wars_war FOREIGN KEY (war_id) REFERENCES wars(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ruler_wars (
    ruler_id INT NOT NULL,
    war_id INT NOT NULL,
    PRIMARY KEY (ruler_id, war_id),
    CONSTRAINT fk_ruler_wars_ruler FOREIGN KEY (ruler_id) REFERENCES rulers(id) ON DELETE CASCADE,
    CONSTRAINT fk_ruler_wars_war FOREIGN KEY (war_id) REFERENCES wars(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cultures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(180) NOT NULL,
    slug VARCHAR(190) NOT NULL UNIQUE,
    category VARCHAR(120),
    summary TEXT,
    content MEDIUMTEXT,
    image VARCHAR(500),
    INDEX idx_cultures_slug (slug),
    INDEX idx_cultures_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE epics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(180) NOT NULL,
    slug VARCHAR(190) NOT NULL UNIQUE,
    related_people VARCHAR(255),
    summary TEXT,
    content MEDIUMTEXT,
    image VARCHAR(500),
    INDEX idx_epics_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(180),
    publisher VARCHAR(180),
    year INT,
    url VARCHAR(500),
    source_type VARCHAR(80),
    INDEX idx_sources_year (year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE content_sources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content_type VARCHAR(80) NOT NULL,
    content_id INT NOT NULL,
    source_id INT NOT NULL,
    CONSTRAINT fk_content_sources_source FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE,
    INDEX idx_content_sources_content (content_type, content_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    file_name VARCHAR(255),
    file_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    caption TEXT,
    image_type VARCHAR(80),
    INDEX idx_images_type (image_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE timeline_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(180) NOT NULL,
    slug VARCHAR(190) NOT NULL UNIQUE,
    year_start INT,
    year_end INT NULL,
    description TEXT,
    event_type VARCHAR(100),
    related_content_id INT NULL,
    INDEX idx_timeline_slug (slug),
    INDEX idx_timeline_year (year_start),
    INDEX idx_timeline_type (event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

