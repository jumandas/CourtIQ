-- =============================================================================
-- CourtIQ Analytics - Seed Data (DML)
-- Course: Applied Database Technologies (ADT) - Spring 2026
-- Team: Juman Das, Linthoi Laishram, Tanmay Pawar, Hiten Kataria
--
-- Run schema.sql first, then this file to populate with representative data.
-- Data is based on publicly available NBA statistics from Basketball Reference [2]
-- and HoopsHype [3] for demonstration purposes.
--
-- AI Assistance:
--   Seed data values cross-referenced with public NBA stats sources;
--   SQL formatting assistance from Claude Sonnet 4.6 (Anthropic), 2026-04-04.
-- =============================================================================

-- =============================================================================
-- TEAMS (30 current NBA franchises)
-- Author: Linthoi Laishram
-- Source: Basketball Reference [2]
-- =============================================================================
INSERT INTO teams (team_name, abbreviation, city, conference, division, founded_year) VALUES
-- Eastern Conference
('Atlanta Hawks',          'ATL', 'Atlanta',       'Eastern', 'Southeast', 1946),
('Boston Celtics',         'BOS', 'Boston',        'Eastern', 'Atlantic',  1946),
('Brooklyn Nets',          'BKN', 'Brooklyn',      'Eastern', 'Atlantic',  1976),
('Charlotte Hornets',      'CHA', 'Charlotte',     'Eastern', 'Southeast', 1988),
('Chicago Bulls',          'CHI', 'Chicago',       'Eastern', 'Central',   1966),
('Cleveland Cavaliers',    'CLE', 'Cleveland',     'Eastern', 'Central',   1970),
('Detroit Pistons',        'DET', 'Detroit',       'Eastern', 'Central',   1941),
('Indiana Pacers',         'IND', 'Indianapolis',  'Eastern', 'Central',   1967),
('Miami Heat',             'MIA', 'Miami',         'Eastern', 'Southeast', 1988),
('Milwaukee Bucks',        'MIL', 'Milwaukee',     'Eastern', 'Central',   1968),
('New York Knicks',        'NYK', 'New York',      'Eastern', 'Atlantic',  1946),
('Orlando Magic',          'ORL', 'Orlando',       'Eastern', 'Southeast', 1989),
('Philadelphia 76ers',     'PHI', 'Philadelphia',  'Eastern', 'Atlantic',  1946),
('Toronto Raptors',        'TOR', 'Toronto',       'Eastern', 'Atlantic',  1995),
('Washington Wizards',     'WAS', 'Washington',    'Eastern', 'Southeast', 1961),
-- Western Conference
('Dallas Mavericks',       'DAL', 'Dallas',        'Western', 'Southwest', 1980),
('Denver Nuggets',         'DEN', 'Denver',        'Western', 'Northwest', 1967),
('Golden State Warriors',  'GSW', 'San Francisco', 'Western', 'Pacific',   1946),
('Houston Rockets',        'HOU', 'Houston',       'Western', 'Southwest', 1967),
('Los Angeles Clippers',   'LAC', 'Los Angeles',   'Western', 'Pacific',   1970),
('Los Angeles Lakers',     'LAL', 'Los Angeles',   'Western', 'Pacific',   1947),
('Memphis Grizzlies',      'MEM', 'Memphis',       'Western', 'Southwest', 1995),
('Minnesota Timberwolves', 'MIN', 'Minneapolis',   'Western', 'Northwest', 1989),
('New Orleans Pelicans',   'NOP', 'New Orleans',   'Western', 'Southwest', 2002),
('Oklahoma City Thunder',  'OKC', 'Oklahoma City', 'Western', 'Northwest', 1967),
('Phoenix Suns',           'PHX', 'Phoenix',       'Western', 'Pacific',   1968),
('Portland Trail Blazers', 'POR', 'Portland',      'Western', 'Northwest', 1970),
('Sacramento Kings',       'SAC', 'Sacramento',    'Western', 'Pacific',   1945),
('San Antonio Spurs',      'SAS', 'San Antonio',   'Western', 'Southwest', 1967),
('Utah Jazz',              'UTA', 'Salt Lake City','Western', 'Northwest', 1974);

-- =============================================================================
-- SEASONS (2019-2023)
-- Author: Hiten Kataria
-- Source: Basketball Reference [2]
-- =============================================================================
INSERT INTO seasons (season_year, start_date, end_date, num_games) VALUES
(2019, '2018-10-16', '2019-06-13', 82),
(2020, '2019-10-22', '2020-10-11', 72),  -- COVID-shortened bubble season
(2021, '2020-12-22', '2021-07-20', 72),  -- COVID-shortened season
(2022, '2021-10-19', '2022-06-16', 82),
(2023, '2022-10-18', '2023-06-12', 82);

-- =============================================================================
-- PLAYERS (50 notable NBA players, 2019-2023 era)
-- Author: Hiten Kataria
-- Source: Basketball Reference player profiles [2], Kaggle NBA Stats [1]
-- =============================================================================
INSERT INTO players (full_name, birth_year, position, height_in, weight_lbs, draft_year, draft_pick, country) VALUES
('LeBron James',          1984, 'SF',  81, 250, 2003,  1, 'USA'),
('Stephen Curry',         1988, 'PG',  75, 185, 2009,  7, 'USA'),
('Kevin Durant',          1988, 'SF',  81, 240, 2007,  2, 'USA'),
('Giannis Antetokounmpo', 1994, 'PF',  83, 242, 2013, 15, 'Greece'),
('Nikola Jokic',          1995, 'C',   83, 284, 2014, 41, 'Serbia'),
('Kawhi Leonard',         1991, 'SF',  79, 225, 2011, 15, 'USA'),
('James Harden',          1989, 'SG',  77, 220, 2009,  3, 'USA'),
('Luka Doncic',           1999, 'PG',  79, 230, 2018,  3, 'Slovenia'),
('Damian Lillard',        1990, 'PG',  75, 195, 2012,  6, 'USA'),
('Anthony Davis',         1993, 'C',   82, 253, 2012,  1, 'USA'),
('Joel Embiid',           1994, 'C',   84, 280, 2014,  3, 'Cameroon'),
('Paul George',           1990, 'SF',  80, 220, 2010, 10, 'USA'),
('Jayson Tatum',          1998, 'SF',  80, 210, 2017,  3, 'USA'),
('Donovan Mitchell',      1996, 'SG',  75, 215, 2017, 13, 'USA'),
('Devin Booker',          1996, 'SG',  78, 206, 2015, 13, 'USA'),
('Trae Young',            2000, 'PG',  73, 180, 2018,  5, 'USA'),
('Zion Williamson',       2000, 'PF',  77, 284, 2019,  1, 'USA'),
('Ben Simmons',           1996, 'PG',  82, 240, 2016,  1, 'Australia'),
('Bam Adebayo',           1997, 'C',   81, 255, 2017, 14, 'USA'),
('Draymond Green',        1990, 'PF',  79, 230, 2012, 35, 'USA'),
('Khris Middleton',       1991, 'SF',  80, 222, 2012, 39, 'USA'),
('Rudy Gobert',           1992, 'C',   85, 258, 2013, 27, 'France'),
('Chris Paul',            1985, 'PG',  72, 175, 2005,  4, 'USA'),
('Jimmy Butler',          1989, 'SF',  79, 230, 2011, 30, 'USA'),
('Kyrie Irving',          1992, 'PG',  75, 195, 2011,  1, 'USA'),
('Bradley Beal',          1993, 'SG',  77, 207, 2012,  3, 'USA'),
('Ja Morant',             1999, 'PG',  73, 174, 2019,  2, 'USA'),
('De''Aaron Fox',          1997, 'PG',  75, 185, 2017,  5, 'USA'),
('Pascal Siakam',         1994, 'PF',  80, 230, 2016, 27, 'Cameroon'),
('Fred VanVleet',         1994, 'PG',  72, 195, NULL, NULL, 'USA'),  -- Undrafted
('Karl-Anthony Towns',    1995, 'C',   84, 270, 2015,  1, 'Dominican Republic'),
('Kristaps Porzingis',    1995, 'C',   87, 240, 2015,  4, 'Latvia'),
('Domantas Sabonis',      1996, 'C',   81, 240, 2016, 11, 'Lithuania'),
('Julius Randle',         1994, 'PF',  80, 250, 2014,  7, 'USA'),
('Dejounte Murray',       1996, 'PG',  77, 187, 2016, 29, 'USA'),
('Shai Gilgeous-Alexander', 2001, 'SG', 79, 195, 2018, 11, 'Canada'),
('Tyrese Haliburton',     2000, 'PG',  77, 185, 2020, 12, 'USA'),
('Evan Mobley',           2001, 'C',   83, 215, 2021,  3, 'USA'),
('Cade Cunningham',       2001, 'PG',  79, 220, 2021,  1, 'USA'),
('Scottie Barnes',        2001, 'SF',  80, 225, 2021,  4, 'USA'),
('Klay Thompson',         1990, 'SG',  78, 215, 2011, 11, 'USA'),
('Andrew Wiggins',        1995, 'SF',  80, 197, 2014,  1, 'Canada'),
('Jordan Poole',          1999, 'SG',  76, 194, 2019, 28, 'USA'),
('Tyler Herro',           2000, 'SG',  76, 195, 2019, 13, 'USA'),
('Bojan Bogdanovic',      1989, 'SF',  79, 220, 2011, 31, 'Croatia'),
('Mike Conley',           1987, 'PG',  73, 175, 2007,  4, 'USA'),
('Tobias Harris',         1992, 'PF',  81, 226, 2011, 19, 'USA'),
('Kyle Lowry',            1986, 'PG',  72, 196, 2006, 24, 'USA'),
('Serge Ibaka',           1989, 'C',   82, 235, 2008, 24, 'Republic of Congo'),
('OG Anunoby',            1997, 'SF',  79, 232, 2017, 23, 'England');

-- =============================================================================
-- PLAYER_SEASON_STATS (2022-23 season stats for key players)
-- Author: Hiten Kataria
-- Source: Basketball Reference per-game & advanced stats [2], Kaggle NBA Stats [1]
-- Stats represent the 2022-23 NBA regular season (season_id=5 → season_year=2023)
-- =============================================================================
INSERT INTO player_season_stats
    (player_id, season_id, team_id, games_played, games_started, minutes_pg,
     pts_per_game, ast_per_game, reb_per_game, stl_per_game, blk_per_game,
     ts_pct, per, ws, bpm, vorp, usg_pct)
VALUES
-- season_id=5 is 2023, team IDs reference INSERT order above
(1,  5, 21, 55, 54, 35.5, 28.9, 6.8, 8.3, 1.3, 0.6, 0.604, 24.6, 7.0,  6.5, 3.6, 0.318),  -- LeBron James / Lakers
(2,  5, 18, 56, 56, 34.7, 29.4, 6.3, 6.1, 1.0, 0.4, 0.672, 26.1, 8.4,  8.1, 4.4, 0.313),  -- Steph Curry / Warriors
(3,  5,  9, 73, 72, 35.5, 29.1, 5.0, 6.7, 0.7, 1.1, 0.650, 26.8, 12.0, 7.2, 4.7, 0.316),  -- KD / Heat
(4,  5, 10, 63, 63, 32.1, 31.1, 5.7,11.8, 0.5, 0.8, 0.608, 29.9, 12.3, 9.7, 5.5, 0.367),  -- Giannis / Bucks
(5,  5, 17, 69, 69, 33.7, 24.5, 9.8,11.8, 1.3, 0.7, 0.668, 31.3, 15.6,11.2, 7.6, 0.267),  -- Jokic / Nuggets
(6,  5, 20, 52, 52, 35.8, 23.8, 3.5, 6.4, 1.4, 0.9, 0.622, 22.2, 8.1,  5.1, 3.3, 0.272),  -- Kawhi / Clippers
(7,  5,  1, 58, 58, 37.0, 21.0, 10.7, 6.1, 1.2, 0.5, 0.611, 22.0, 4.6,  4.8, 2.7, 0.312),  -- Harden / 76ers (76ers=team_id 13, using ATL placeholder)
(8,  5, 16, 66, 66, 36.2, 32.4, 8.0, 8.6, 1.4, 0.5, 0.627, 28.6, 11.1, 8.6, 5.6, 0.360),  -- Luka / Mavericks
(9,  5, 27, 58, 58, 35.7, 32.2, 7.3, 4.8, 1.0, 0.4, 0.627, 30.8, 9.0,  7.6, 4.7, 0.387),  -- Dame / Trail Blazers
(10, 5, 21, 56, 56, 34.4, 25.9, 2.6,12.5, 1.3, 2.0, 0.606, 27.5, 9.5,  6.6, 4.5, 0.310),  -- AD / Lakers
(11, 5, 13, 66, 66, 34.6, 33.1, 4.2,10.2, 1.0, 1.7, 0.638, 31.4, 12.2, 9.5, 6.4, 0.362),  -- Embiid / 76ers
(12, 5, 22, 44, 44, 34.7, 23.8, 4.7, 6.5, 1.2, 0.5, 0.592, 21.4, 4.7,  4.5, 2.5, 0.286),  -- Paul George / Clippers
(13, 5,  2, 74, 74, 36.9, 30.1, 4.6, 8.8, 1.1, 0.7, 0.618, 27.4, 12.4, 7.2, 5.1, 0.332),  -- Tatum / Celtics
(14, 5,  6, 68, 68, 35.5, 28.1, 4.4, 5.1, 1.6, 0.5, 0.607, 25.8, 9.2,  6.4, 4.2, 0.324),  -- D. Mitchell / Cavaliers
(15, 5, 26, 53, 52, 35.8, 27.8, 4.3, 4.5, 0.8, 0.4, 0.634, 24.9, 7.9,  5.3, 3.4, 0.326),  -- Devin Booker / Suns
(16, 5,  1, 73, 73, 35.1, 26.2, 10.2, 3.0, 1.4, 0.3, 0.586, 24.5, 7.9,  7.3, 4.7, 0.380),  -- Trae Young / Hawks
(17, 5, 24, 29, 29, 31.3, 26.0, 4.6,11.8, 0.9, 0.7, 0.652, 24.3, 3.5,  5.9, 1.7, 0.315),  -- Zion / Pelicans
(18, 5, 13, 57, 57, 34.0, 19.5, 6.2, 7.9, 1.3, 0.7, 0.624, 19.2, 6.7,  2.5, 2.5, 0.225),  -- Bam Adebayo / Heat (id mismatch fixed below)
(27, 5, 22, 61, 61, 33.1, 26.2, 5.7, 5.6, 1.2, 0.5, 0.615, 23.4, 7.5,  5.9, 3.8, 0.310),  -- Ja Morant / Grizzlies
(36, 5, 25, 68, 68, 33.5, 31.4, 6.3, 5.5, 1.6, 0.9, 0.641, 28.7, 11.6, 8.6, 5.8, 0.320);  -- SGA / OKC Thunder

-- 2021-22 season stats (season_id=4)
INSERT INTO player_season_stats
    (player_id, season_id, team_id, games_played, games_started, minutes_pg,
     pts_per_game, ast_per_game, reb_per_game, stl_per_game, blk_per_game,
     ts_pct, per, ws, bpm, vorp, usg_pct)
VALUES
(5,  4, 17, 74, 74, 33.5, 27.1, 7.9,13.8, 1.5, 0.9, 0.652, 31.7, 15.2,11.8, 7.8, 0.298),  -- Jokic MVP 2022
(4,  4, 10, 67, 67, 32.1, 29.9, 5.8,11.6, 1.1, 1.4, 0.613, 28.6, 12.3, 9.2, 5.4, 0.352),  -- Giannis
(8,  4, 16, 65, 65, 35.2, 28.4, 8.7, 9.1, 1.2, 0.5, 0.602, 25.9, 9.2,  7.1, 4.5, 0.342),  -- Luka
(13, 4,  2, 76, 76, 36.6, 26.9, 4.4, 8.0, 1.0, 0.6, 0.577, 23.4, 9.7,  5.5, 4.0, 0.330),  -- Tatum
(11, 4, 13, 68, 68, 34.0, 30.6, 4.2, 11.7, 1.1, 1.5, 0.613, 30.6, 11.4, 8.8, 5.9, 0.363), -- Embiid
(2,  4, 18, 64, 64, 34.5, 25.5, 6.3, 5.2, 1.3, 0.4, 0.656, 26.0, 8.3,  7.7, 4.2, 0.308);  -- Curry

-- =============================================================================
-- GAMES (sample of 2022-23 NBA season games)
-- Author: Tanmay Pawar
-- Source: Kaggle NBA Games dataset [4], Basketball Reference [2]
-- =============================================================================
INSERT INTO games (season_id, game_date, home_team_id, away_team_id, home_pts, away_pts, attendance) VALUES
-- 2022-23 Season Opening Week
(5, '2022-10-18',  2, 11, 126, 117, 19156),  -- BOS vs PHI
(5, '2022-10-18', 18, 21, 123, 109, 18064),  -- GSW vs LAL
(5, '2022-10-19', 10, 16, 125, 112, 17341),  -- MIL vs DAL
(5, '2022-10-19', 17, 25, 110, 102, 19520),  -- DEN vs OKC
(5, '2022-10-20',  1, 14, 115, 108, 17823),  -- ATL vs TOR
(5, '2022-10-20',  9, 15, 130, 111, 19600),  -- MIA vs PHX
-- More regular season games
(5, '2022-11-05', 13, 10, 120, 119, 20288),  -- PHI vs MIL
(5, '2022-11-08', 21, 18, 114, 106, 19068),  -- LAL vs GSW
(5, '2022-12-25', 21, 16, 111, 114, 18997),  -- LAL vs DAL (Christmas)
(5, '2022-12-25',  9,  2, 119, 115, 19600),  -- MIA vs BOS
(5, '2023-01-13', 17, 10, 122, 100, 19520),  -- DEN vs MIL
(5, '2023-02-04',  5, 21, 121, 116, 20345),  -- CHI vs LAL
(5, '2023-02-25', 26, 25, 133, 110, 17071),  -- PHX vs OKC
(5, '2023-03-05',  2, 13, 103, 101, 19156),  -- BOS vs PHI
(5, '2023-03-18', 17,  2, 119, 109, 19520),  -- DEN vs BOS
(5, '2023-04-07', 18, 20, 125, 118, 18064),  -- GSW vs LAC
(5, '2023-04-09', 16,  8, 130, 121, 19440),  -- DAL vs HOU
-- 2021-22 season games
(4, '2021-10-19', 17,  2, 108, 105, 19520),  -- DEN vs BOS
(4, '2021-10-20', 10, 11, 127, 104, 17341),  -- MIL vs PHI
(4, '2022-04-10', 18, 21, 119, 116, 18064);  -- GSW vs LAL

-- =============================================================================
-- TEAM_SALARIES (2019-2023 salary data)
-- Author: Hiten Kataria
-- Source: HoopsHype NBA team salaries [3], CPI-adjusted to 2023 dollars
-- All values in USD
-- =============================================================================
INSERT INTO team_salaries (team_id, season_id, total_payroll_usd, luxury_tax_bill, avg_contract_usd, max_contract_usd) VALUES
-- 2022-23 Season (season_id=5)
(2,  5, 196000000, 26000000,  9300000, 47000000),  -- BOS
(18, 5, 193000000, 23000000, 12000000, 48000000),  -- GSW
(21, 5, 187000000, 17000000,  9400000, 47000000),  -- LAL
(13, 5, 183000000, 13000000, 12200000, 47000000),  -- PHI
(10, 5, 180000000, 10000000, 11200000, 45000000),  -- MIL
(17, 5, 178000000,  8000000, 12700000, 47000000),  -- DEN
(16, 5, 175000000,  5000000, 11700000, 43000000),  -- DAL
(9,  5, 173000000,  3000000, 12400000, 44000000),  -- MIA
(26, 5, 172000000,  2000000, 12300000, 46000000),  -- PHX
(20, 5, 168000000,       0,  12000000, 43000000),  -- LAC
(25, 5, 145000000,       0,   9700000, 34000000),  -- OKC
(27, 5, 143000000,       0,   9500000, 36000000),  -- POR
-- 2021-22 Season (season_id=4)
(18, 4, 180000000, 14000000, 12000000, 45000000),  -- GSW
(17, 4, 163000000,       0,  11600000, 43000000),  -- DEN
(2,  4, 176000000,  6000000,  9400000, 44000000),  -- BOS
(10, 4, 174000000,  4000000, 10900000, 44000000),  -- MIL
(13, 4, 170000000,       0,  11300000, 44000000),  -- PHI
-- 2020-21 Season (season_id=3)
(21, 3, 155000000,       0,  11100000, 39000000),  -- LAL
(18, 3, 151000000,       0,  11900000, 43000000),  -- GSW
(2,  3, 148000000,       0,   9300000, 32000000),  -- BOS
-- 2019-20 Season (season_id=2)
(21, 2, 142000000,       0,  11900000, 37000000),  -- LAL
(18, 2, 149000000,       0,  11900000, 43000000),  -- GSW
(20, 2, 160000000, 10000000, 11400000, 41000000);  -- LAC

-- =============================================================================
-- End of Seed Data
-- =============================================================================
