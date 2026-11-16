<?php
require_once __DIR__ . '/database.php';

function e(?string $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

function sanitizeOutput(?string $value): string
{
    return e($value);
}

function excerpt(?string $value, int $length = 150): string
{
    $text = trim(strip_tags((string) $value));
    if (mb_strlen($text) <= $length) {
        return $text;
    }
    return mb_substr($text, 0, $length - 3) . '...';
}

function app_url(string $path = ''): string
{
    $path = '/' . ltrim($path, '/');
    return APP_URL !== '' ? APP_URL . $path : $path;
}

function detail_url(string $type, string $slug): string
{
    return app_url($type . '/' . $slug);
}

function fetch_all(string $sql, array $params = []): array
{
    $statement = db()->prepare($sql);
    $statement->execute($params);
    return $statement->fetchAll();
}

function fetch_one(string $sql, array $params = []): ?array
{
    $statement = db()->prepare($sql);
    $statement->execute($params);
    $row = $statement->fetch();
    return $row ?: null;
}

function count_rows(string $table): int
{
    $allowed = ['states', 'rulers', 'wars', 'sources', 'cultures', 'epics', 'timeline_events'];
    if (!in_array($table, $allowed, true)) {
        return 0;
    }
    return (int) fetch_one("SELECT COUNT(*) AS total FROM {$table}")['total'];
}

function current_page(): int
{
    return max(1, (int) ($_GET['page'] ?? 1));
}

function paginate(string $table, int $perPage = 24): array
{
    $page = current_page();
    $total = count_rows($table);
    return [
        'page' => $page,
        'per_page' => $perPage,
        'total' => $total,
        'pages' => max(1, (int) ceil($total / $perPage)),
        'offset' => ($page - 1) * $perPage,
    ];
}

function get_featured_states(int $limit = 6): array
{
    return fetch_all('SELECT * FROM states WHERE status = ? ORDER BY start_year ASC LIMIT ' . (int) $limit, ['published']);
}

function get_states(int $limit = 24, int $offset = 0): array
{
    return fetch_all('SELECT * FROM states ORDER BY start_year ASC LIMIT ' . (int) $limit . ' OFFSET ' . (int) $offset);
}

function get_state_by_slug(string $slug): ?array
{
    // URL üzerinden gelen slug ile eşleşen devleti veritabanında arıyoruz.
    return fetch_one('SELECT * FROM states WHERE slug = ? LIMIT 1', [$slug]);
}

function get_rulers_by_state(int $stateId): array
{
    return fetch_all('SELECT * FROM rulers WHERE state_id = ? ORDER BY reign_start ASC', [$stateId]);
}

function get_wars_by_state(int $stateId): array
{
    return fetch_all(
        'SELECT wars.* FROM wars
         INNER JOIN state_wars ON state_wars.war_id = wars.id
         WHERE state_wars.state_id = ?
         ORDER BY wars.year ASC',
        [$stateId]
    );
}

function get_rulers(int $limit = 24, int $offset = 0): array
{
    return fetch_all(
        'SELECT rulers.*, states.name AS state_name
         FROM rulers
         LEFT JOIN states ON states.id = rulers.state_id
         ORDER BY rulers.reign_start ASC
         LIMIT ' . (int) $limit . ' OFFSET ' . (int) $offset
    );
}

function get_ruler_by_slug(string $slug): ?array
{
    return fetch_one(
        'SELECT rulers.*, states.name AS state_name, states.slug AS state_slug
         FROM rulers
         LEFT JOIN states ON states.id = rulers.state_id
         WHERE rulers.slug = ?
         LIMIT 1',
        [$slug]
    );
}

function get_wars_by_ruler(int $rulerId): array
{
    return fetch_all(
        'SELECT wars.* FROM wars
         INNER JOIN ruler_wars ON ruler_wars.war_id = wars.id
         WHERE ruler_wars.ruler_id = ?
         ORDER BY wars.year ASC',
        [$rulerId]
    );
}

function get_wars(int $limit = 24, int $offset = 0): array
{
    return fetch_all('SELECT * FROM wars ORDER BY year ASC LIMIT ' . (int) $limit . ' OFFSET ' . (int) $offset);
}

function get_war_by_slug(string $slug): ?array
{
    return fetch_one('SELECT * FROM wars WHERE slug = ? LIMIT 1', [$slug]);
}

function get_states_by_war(int $warId): array
{
    return fetch_all(
        'SELECT states.* FROM states
         INNER JOIN state_wars ON state_wars.state_id = states.id
         WHERE state_wars.war_id = ?
         ORDER BY states.start_year ASC',
        [$warId]
    );
}

function get_timeline_events(int $limit = 100): array
{
    return fetch_all('SELECT * FROM timeline_events ORDER BY year_start ASC LIMIT ' . (int) $limit);
}

function get_latest_content(int $limit = 8): array
{
    return fetch_all(
        "(SELECT name AS title, slug, short_description AS summary, 'devlet' AS type, updated_at FROM states)
         UNION ALL
         (SELECT name AS title, slug, biography AS summary, 'hukumdar' AS type, updated_at FROM rulers)
         UNION ALL
         (SELECT name AS title, slug, description AS summary, 'savas' AS type, updated_at FROM wars)
         ORDER BY updated_at DESC
         LIMIT " . (int) $limit
    );
}

function get_sources(): array
{
    return fetch_all('SELECT * FROM sources ORDER BY year DESC, title ASC');
}

function search_content(string $query): array
{
    // Kullanıcının arama metnini prepared statement ile SQL sorgularına gönderiyoruz.
    $like = '%' . $query . '%';
    return [
        'Devletler' => fetch_all('SELECT name AS title, slug, short_description AS summary FROM states WHERE name LIKE ? OR short_description LIKE ? OR description LIKE ? LIMIT 20', [$like, $like, $like]),
        'Hükümdarlar' => fetch_all('SELECT name AS title, slug, biography AS summary FROM rulers WHERE name LIKE ? OR biography LIKE ? OR achievements LIKE ? LIMIT 20', [$like, $like, $like]),
        'Savaşlar' => fetch_all('SELECT name AS title, slug, description AS summary FROM wars WHERE name LIKE ? OR date_text LIKE ? OR description LIKE ? LIMIT 20', [$like, $like, $like]),
        'Kültür' => fetch_all('SELECT title, slug, summary FROM cultures WHERE title LIKE ? OR summary LIKE ? OR content LIKE ? LIMIT 20', [$like, $like, $like]),
        'Destanlar' => fetch_all('SELECT name AS title, slug, summary FROM epics WHERE name LIKE ? OR summary LIKE ? OR content LIKE ? LIMIT 20', [$like, $like, $like]),
    ];
}

function render_pagination(int $page, int $pages): void
{
    if ($pages <= 1) {
        return;
    }
    echo '<nav class="pagination" aria-label="Sayfalama">';
    for ($i = 1; $i <= $pages; $i++) {
        $class = $i === $page ? ' class="active"' : '';
        echo '<a' . $class . ' href="?page=' . $i . '">' . $i . '</a>';
    }
    echo '</nav>';
}

function require_slug(): string
{
    $slug = trim((string) ($_GET['slug'] ?? ''));
    if ($slug === '' || !preg_match('/^[a-z0-9-]+$/', $slug)) {
        require BASE_PATH . '/404.php';
        exit;
    }
    return $slug;
}

function generateSlug(string $text): string
{
    $map = ['ı' => 'i', 'ğ' => 'g', 'ü' => 'u', 'ş' => 's', 'ö' => 'o', 'ç' => 'c', 'İ' => 'i', 'Ğ' => 'g', 'Ü' => 'u', 'Ş' => 's', 'Ö' => 'o', 'Ç' => 'c'];
    $text = strtr($text, $map);
    $text = strtolower($text);
    $text = preg_replace('/[^a-z0-9]+/', '-', $text);
    return trim((string) $text, '-');
}

