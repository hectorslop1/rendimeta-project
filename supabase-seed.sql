-- =====================================================
-- RENDIMETA - SEED DATA
-- =====================================================
-- Datos iniciales para demo
-- =====================================================

-- =====================================================
-- USERS
-- =====================================================
-- Password for all users: "admin123" (hashed with bcrypt)
-- Hash: $2a$10$rOjLHKm8K3qVZ5Y5Z5Y5ZeO5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y
INSERT INTO users (id, email, password_hash, name, station, role, level, station_ids, xp, streak, total_sales) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'admin@sistema.com', '$2a$10$rOjLHKm8K3qVZ5Y5Z5Y5ZeO5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y', 'Super Admin', 'Oficina Central', 'admin', 5, ARRAY['all'], 500, 15, 0),
  ('550e8400-e29b-41d4-a716-446655440002', 'gerente.regional@sistema.com', '$2a$10$rOjLHKm8K3qVZ5Y5Z5Y5ZeO5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y', 'María González', 'Región Norte', 'regional_manager', 3, ARRAY['all'], 350, 10, 0),
  ('550e8400-e29b-41d4-a716-446655440003', 'supervisor@sistema.com', '$2a$10$rOjLHKm8K3qVZ5Y5Z5Y5ZeO5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y', 'Carlos Ramírez', 'Estación Reforma #42', 'supervisor', 1, ARRAY['station_42'], 280, 8, 0),
  ('550e8400-e29b-41d4-a716-446655440004', 'luis@sistema.com', '$2a$10$rOjLHKm8K3qVZ5Y5Z5Y5ZeO5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y', 'Luis García', 'Estación Reforma #42', 'dispatcher', 1, ARRAY['station_42'], 215, 5, 87),
  ('550e8400-e29b-41d4-a716-446655440005', 'ana@sistema.com', '$2a$10$rOjLHKm8K3qVZ5Y5Z5Y5ZeO5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y', 'Ana Rodríguez', 'Estación Centro #15', 'dispatcher', 1, ARRAY['station_15'], 320, 12, 142),
  ('550e8400-e29b-41d4-a716-446655440006', 'pedro@sistema.com', '$2a$10$rOjLHKm8K3qVZ5Y5Z5Y5ZeO5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y', 'Pedro Sánchez', 'Estación Sur #28', 'dispatcher', 1, ARRAY['station_28'], 180, 3, 65);

-- =====================================================
-- BADGES
-- =====================================================
INSERT INTO badges (id, name, description, tier, icon) VALUES
  ('first_sale', 'Primera Venta', 'Registra tu primera venta', 'bronze', 'star_rounded'),
  ('streak_3', 'Racha de 3', '3 días consecutivos activo', 'bronze', 'local_fire_department_rounded'),
  ('oil_master', 'Maestro del Aceite', 'Vende 50 aceites', 'silver', 'opacity_rounded'),
  ('streak_7', 'Racha de 7', '7 días consecutivos activo', 'silver', 'bolt_rounded'),
  ('sales_100', 'Centenario', 'Registra 100 ventas totales', 'gold', 'emoji_events_rounded'),
  ('training_5', 'Estudiante Dedicado', 'Completa 5 capacitaciones', 'bronze', 'school_rounded'),
  ('snack_pro', 'Snack Pro', 'Vende 30 snacks en una semana', 'silver', 'fastfood_rounded'),
  ('top_3', 'Top 3', 'Llega al Top 3 del ranking', 'gold', 'workspace_premium_rounded'),
  ('all_missions', 'Misión Cumplida', 'Completa todas las misiones del día', 'bronze', 'task_alt_rounded');

-- =====================================================
-- USER_BADGES (Luis's badges)
-- =====================================================
INSERT INTO user_badges (user_id, badge_id, unlocked, unlocked_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440004', 'first_sale', true, NOW() - INTERVAL '10 days'),
  ('550e8400-e29b-41d4-a716-446655440004', 'streak_3', true, NOW() - INTERVAL '5 days'),
  ('550e8400-e29b-41d4-a716-446655440004', 'oil_master', true, NOW() - INTERVAL '2 days'),
  ('550e8400-e29b-41d4-a716-446655440004', 'streak_7', false, NULL),
  ('550e8400-e29b-41d4-a716-446655440004', 'sales_100', false, NULL),
  ('550e8400-e29b-41d4-a716-446655440004', 'training_5', true, NOW() - INTERVAL '3 days'),
  ('550e8400-e29b-41d4-a716-446655440004', 'snack_pro', false, NULL),
  ('550e8400-e29b-41d4-a716-446655440004', 'top_3', false, NULL),
  ('550e8400-e29b-41d4-a716-446655440004', 'all_missions', true, NOW() - INTERVAL '1 day');

-- =====================================================
-- DAILY_MISSIONS
-- =====================================================
INSERT INTO daily_missions (id, description, product_type, target, xp_reward, active) VALUES
  ('mission_1', 'Vende 3 aceites', 'aceite', 3, 25, true),
  ('mission_2', 'Ofrece 5 aromatizantes', 'aromatizante', 5, 30, true),
  ('mission_3', 'Completa 1 capacitación', 'other', 1, 15, true),
  ('mission_4', 'Vende 10 snacks', 'snack', 10, 35, true),
  ('mission_5', 'Vende 2 accesorios', 'accesorio', 2, 20, true);

-- =====================================================
-- USER_MISSIONS (Luis's progress)
-- =====================================================
INSERT INTO user_missions (user_id, mission_id, current, completed) VALUES
  ('550e8400-e29b-41d4-a716-446655440004', 'mission_1', 1, false),
  ('550e8400-e29b-41d4-a716-446655440004', 'mission_2', 2, false),
  ('550e8400-e29b-41d4-a716-446655440004', 'mission_3', 0, false);

-- =====================================================
-- TRAINING_VIDEOS
-- =====================================================
INSERT INTO training_videos (id, title, subtitle, duration, xp_reward, accent_color) VALUES
  ('v1', 'Técnica de venta cruzada', 'Aprende a ofrecer productos complementarios', '0:45', 10, '#E6007A'),
  ('v2', 'Manejo de objeciones', 'Responde con confianza a los clientes', '1:20', 15, '#7A28FF'),
  ('v3', 'Conoce los aceites premium', 'Diferencias entre marcas y viscosidades', '0:55', 10, '#2DE2E2'),
  ('v4', 'Atención al cliente 5 estrellas', 'Haz que cada cliente regrese', '1:10', 15, '#FFAA5E'),
  ('v5', 'Aromatizantes: guía rápida', 'Conoce fragancias y presentaciones', '0:35', 10, '#E6007A'),
  ('v6', 'Seguridad en estación', 'Protocolo básico de seguridad', '1:30', 20, '#7A28FF');

-- =====================================================
-- USER_TRAINING (Luis's completed videos)
-- =====================================================
INSERT INTO user_training (user_id, video_id, completed, completed_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440004', 'v1', true, NOW() - INTERVAL '5 days'),
  ('550e8400-e29b-41d4-a716-446655440004', 'v2', false, NULL),
  ('550e8400-e29b-41d4-a716-446655440004', 'v3', false, NULL),
  ('550e8400-e29b-41d4-a716-446655440004', 'v4', false, NULL),
  ('550e8400-e29b-41d4-a716-446655440004', 'v5', false, NULL),
  ('550e8400-e29b-41d4-a716-446655440004', 'v6', false, NULL);

-- =====================================================
-- SALES (Recent sales for Luis)
-- =====================================================
INSERT INTO sales (user_id, product_type, quantity, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440004', 'aceite', 1, NOW() - INTERVAL '2 hours'),
  ('550e8400-e29b-41d4-a716-446655440004', 'snack', 2, NOW() - INTERVAL '3 hours'),
  ('550e8400-e29b-41d4-a716-446655440004', 'aromatizante', 1, NOW() - INTERVAL '4 hours'),
  ('550e8400-e29b-41d4-a716-446655440004', 'snack', 1, NOW() - INTERVAL '5 hours'),
  ('550e8400-e29b-41d4-a716-446655440004', 'aromatizante', 1, NOW() - INTERVAL '6 hours');

-- =====================================================
-- ITEMS (Generic demo items)
-- =====================================================
INSERT INTO items (title, description, status, user_id) VALUES
  ('Revisar inventario de aceites', 'Verificar stock de aceites sintéticos', 'pending', '550e8400-e29b-41d4-a716-446655440004'),
  ('Capacitación completada', 'Terminé el video de venta cruzada', 'completed', '550e8400-e29b-41d4-a716-446655440004'),
  ('Promoción de aromatizantes', 'Ofrecer aromatizantes con cada servicio', 'active', '550e8400-e29b-41d4-a716-446655440004'),
  ('Limpieza de área de trabajo', 'Mantener el área limpia y ordenada', 'active', '550e8400-e29b-41d4-a716-446655440004'),
  ('Meta semanal cumplida', 'Alcancé 50 ventas esta semana', 'completed', '550e8400-e29b-41d4-a716-446655440005'),
  ('Nuevo producto en stock', 'Llegaron nuevos aromatizantes premium', 'pending', '550e8400-e29b-41d4-a716-446655440005');
