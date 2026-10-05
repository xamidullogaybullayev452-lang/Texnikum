-- ====================================================================
-- TEST PLATFORMASI — SUPABASE POSTGRESQL MA'LUMOTLAR BAZASI SXEMASI
-- Yuqori yuklama (500+ bir vaqtda test topshiruvchi) uchun optimallashtirilgan
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TURLARI
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE test_status AS ENUM ('draft', 'open', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE question_type AS ENUM ('single_choice', 'true_false');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE attempt_status AS ENUM ('in_progress', 'passed', 'failed', 'abandoned');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. JADVALLAR (TABLES)

-- Foydalanuvchilar jadvali (Admin, O'qituvchi, O'quvchi)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- O'qituvchilar profil jadvali
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    subject VARCHAR(150),
    telegram_chat_id VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- O'quvchilar profil jadvali
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    telegram_chat_id VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Guruhlar jadvali
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Guruh a'zolari (o'quvchilar)
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(group_id, student_id)
);

-- Testlar jadvali
CREATE TABLE IF NOT EXISTS public.tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    book_name VARCHAR(255),
    subject VARCHAR(150) NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    max_attempts INTEGER NOT NULL DEFAULT 1,
    passing_percentage INTEGER NOT NULL DEFAULT 70,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    shuffle_questions BOOLEAN NOT NULL DEFAULT true,
    shuffle_options BOOLEAN NOT NULL DEFAULT true,
    show_answers_after_result BOOLEAN NOT NULL DEFAULT true,
    show_explanations BOOLEAN NOT NULL DEFAULT true,
    status test_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Savollar jadvali
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type question_type NOT NULL DEFAULT 'single_choice',
    points NUMERIC(5, 2) NOT NULL DEFAULT 1.0,
    order_index INTEGER NOT NULL DEFAULT 0,
    explanation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Savol variantlari jadvali
CREATE TABLE IF NOT EXISTS public.question_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    option_letter VARCHAR(10) NOT NULL, -- 'A', 'B', 'C', 'D' yoki 'Ha', 'Yo''q'
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    order_index INTEGER NOT NULL DEFAULT 0
);

-- Test urinishlari jadvali (Test attempts)
CREATE TABLE IF NOT EXISTS public.test_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    time_spent_seconds INTEGER DEFAULT 0,
    score NUMERIC(6, 2) DEFAULT 0,
    max_score NUMERIC(6, 2) DEFAULT 0,
    percentage NUMERIC(5, 2) DEFAULT 0,
    status attempt_status NOT NULL DEFAULT 'in_progress',
    window_exit_count INTEGER NOT NULL DEFAULT 0,
    auto_submitted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Talaba bergan javoblar
CREATE TABLE IF NOT EXISTS public.answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES public.test_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    selected_option VARCHAR(10),
    is_correct BOOLEAN DEFAULT false,
    answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(attempt_id, question_id)
);

-- Test izohlari
CREATE TABLE IF NOT EXISTS public.test_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Telegram bir martalik kodlari (OTP)
CREATE TABLE IF NOT EXISTS public.telegram_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) NOT NULL,
    code VARCHAR(10) NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT false,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Telegram xabarnomalari jurnali
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_chat_id VARCHAR(50) NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    is_sent BOOLEAN NOT NULL DEFAULT false,
    sent_at TIMESTAMPTZ,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- 4. 500 FOYDALANUVCHI UCHUN OPTIMALLASHTIRILGAN INDEKSLAR (INDEXES)
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_student ON public.group_members(student_id);
CREATE INDEX IF NOT EXISTS idx_tests_group_status ON public.tests(group_id, status);
CREATE INDEX IF NOT EXISTS idx_tests_teacher ON public.tests(teacher_id);
CREATE INDEX IF NOT EXISTS idx_questions_test ON public.questions(test_id, order_index);
CREATE INDEX IF NOT EXISTS idx_question_options_q ON public.question_options(question_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_student_test ON public.test_attempts(student_id, test_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_test_status ON public.test_attempts(test_id, status);
CREATE INDEX IF NOT EXISTS idx_answers_attempt ON public.answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_telegram_verifications_phone_code ON public.telegram_verifications(phone, code, is_used);

-- ====================================================================
-- 5. ROW LEVEL SECURITY (RLS) SIYOSATLARI
-- ====================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_verifications ENABLE ROW LEVEL SECURITY;

-- Oddiy foydalanuvchilar to'g'ridan-to'g'ri to'g'ri javoblarni o'qiy olmasin
CREATE POLICY question_options_student_view ON public.question_options
    FOR SELECT
    USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role IN ('admin', 'teacher')
        )
    );

-- O'quvchi faqat o'z urinishlarini ko'rishi mumkin
CREATE POLICY student_own_attempts ON public.test_attempts
    FOR SELECT
    USING (student_id = auth.uid() OR auth.role() = 'service_role');

-- ====================================================================
-- 6. SERVER-SIDE NATIJANI AVTOMATIK HISOBLASH TRIGGER / FUNKSIYASI
-- ====================================================================
CREATE OR REPLACE FUNCTION calculate_attempt_result(p_attempt_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_total_points NUMERIC := 0;
    v_earned_points NUMERIC := 0;
    v_percentage NUMERIC := 0;
    v_passing_percentage NUMERIC := 70;
    v_passed BOOLEAN := false;
    v_test_id UUID;
BEGIN
    SELECT test_id INTO v_test_id FROM public.test_attempts WHERE id = p_attempt_id;
    SELECT passing_percentage INTO v_passing_percentage FROM public.tests WHERE id = v_test_id;

    -- Jami savollar balli
    SELECT COALESCE(SUM(points), 0) INTO v_total_points 
    FROM public.questions 
    WHERE test_id = v_test_id;

    -- To'g'ri berilgan javoblar balli
    SELECT COALESCE(SUM(q.points), 0) INTO v_earned_points
    FROM public.answers a
    JOIN public.questions q ON a.question_id = q.id
    JOIN public.question_options qo ON qo.question_id = q.id 
        AND qo.option_letter = a.selected_option 
        AND qo.is_correct = true
    WHERE a.attempt_id = p_attempt_id;

    IF v_total_points > 0 THEN
        v_percentage := ROUND((v_earned_points / v_total_points) * 100, 2);
    ELSE
        v_percentage := 0;
    END IF;

    v_passed := (v_percentage >= v_passing_percentage);

    UPDATE public.test_attempts
    SET 
        score = v_earned_points,
        max_score = v_total_points,
        percentage = v_percentage,
        status = CASE WHEN v_passed THEN 'passed'::attempt_status ELSE 'failed'::attempt_status END,
        submitted_at = NOW(),
        end_time = NOW()
    WHERE id = p_attempt_id;

    RETURN jsonb_build_object(
        'score', v_earned_points,
        'max_score', v_total_points,
        'percentage', v_percentage,
        'passed', v_passed
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
