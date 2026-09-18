-- ==========================================================
-- ReelToReal PostgreSQL + pgvector Database Initialization
-- Execute this script in your Supabase SQL Editor or psql console
-- ==========================================================

-- 1. Enable the pgvector extension for vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create the reels table
CREATE TABLE IF NOT EXISTS reels (
    video_id VARCHAR(255) PRIMARY KEY,
    status VARCHAR(50) DEFAULT 'success',
    source_type VARCHAR(50) NOT NULL, -- 'url' or 'upload'
    source_url TEXT,
    local_file_path TEXT,
    ingested_at TIMESTAMPTZ DEFAULT NOW(),
    duration_seconds NUMERIC(6, 2),
    processing_mode VARCHAR(50),
    frames_count INT DEFAULT 0,
    audio_file_path TEXT,

    -- Extracted Categorical & Semantic Data
    category VARCHAR(100),
    place VARCHAR(255),
    city VARCHAR(100),
    country VARCHAR(100),
    cuisine VARCHAR(100),
    foods JSONB DEFAULT '[]'::jsonb,
    destination VARCHAR(255),
    activity_name VARCHAR(255),
    product_name VARCHAR(255),
    tip_summary TEXT,
    objects JSONB DEFAULT '[]'::jsonb,
    transcript TEXT,
    ocr_text JSONB DEFAULT '[]'::jsonb,
    summary TEXT NOT NULL,
    tags JSONB DEFAULT '[]'::jsonb,

    -- Real-world Geocoding (OpenStreetMap + Google Maps)
    location JSONB,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),

    -- Semantic Vector Embedding (768 dimensions for Gemini text-embedding-004)
    embedding vector(768)
);

-- 3. Create an HNSW index for ultra-fast approximate cosine nearest neighbor search
CREATE INDEX IF NOT EXISTS reels_embedding_hnsw_idx 
ON reels USING hnsw (embedding vector_cosine_ops);

-- 4. Create the plans table for trip and activity itineraries
CREATE TABLE IF NOT EXISTS plans (
    plan_id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    question TEXT NOT NULL,
    created_at DATE DEFAULT CURRENT_DATE,
    reel_ids JSONB DEFAULT '[]'::jsonb,
    timeline_label VARCHAR(255),
    timeline JSONB DEFAULT '[]'::jsonb,
    key_dates JSONB DEFAULT '[]'::jsonb,
    locations JSONB DEFAULT '[]'::jsonb,
    steps JSONB DEFAULT '[]'::jsonb,
    packing JSONB DEFAULT '[]'::jsonb,
    overview TEXT
);
