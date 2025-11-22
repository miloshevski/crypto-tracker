# Домашна Работа 1 - Pipe and Filter Архитектура

## Преглед

Ова решение имплементира автоматизиран систем за собирање и анализа на податоци за криптовалути користејќи Pipe and Filter архитектурен образец. Системот ги обработува податоците низ три главни филтри кои работат последователно, каде излезот од еден филтер служи како влез за следниот.

## Архитектура

### Pipe and Filter Образец

Системот е организиран во три главни филтри:

1. **Filter 1: Get Top Symbols** - Преземање на валидни симболи
2. **Filter 2: Check Last Date** - Проверка на последна достапна дата
3. **Filter 3: Fill Data** - Пополнување со историски податоци

Секој филтер е независен, модуларен компонент кој може да се тестира и одржува посебно.

### Компоненти

#### 1. Filter 1: Get Top Symbols (`filter1_get_symbols.py`)

**Цел**: Преземање на топ 1000 криптовалути по market cap и филтрирање на валидните.

**Процес**:
- Паралелно преземање на 4 страници од CoinGecko API (250 криптовалути по страница)
- Примена на валидациски критериуми:
  - Постоење на symbol и name
  - Актуелна цена (отфрлање на делистирани)
  - 24-часовен волумен поголем од MIN_VOLUME_24H
  - Market cap поголем од MIN_MARKET_CAP
  - Постоење на market cap rank
- Отстранување на дупликати (задржување на најрангираната верзија)
- Сортирање по ранг

**Излез**: Листа на валидни криптовалути (максимум 1000)

#### 2. Filter 2: Check Last Date (`filter2_check_last_date.py`)

**Цел**: Проверка на постоечки податоци во база и одредување кои податоци недостасуваат.

**Процес**:
- Креирање на mapping за Binance симбли (BTC -> BTC/USDT)
- Batch проверка на последна достапна дата за сите симболи (оптимизирано)
- Пресметка на број на денови што недостасуваат
- Ажурирање на metadata табела

**Оптимизација**: Користи batch query наместо N+1 queries за значително подобрување на перформансите.

**Излез**: Листа на симболи со информации за недостасувачки податоци

#### 3. Filter 3: Fill Data (`filter3_fill_data.py`)

**Цел**: Преземање и чување на историски OHLCV податоци.

**Процес**:
- Паралелно преземање од повеќе exchanges (Binance, Coinbase, Kraken)
- Fallback механизам - доколку симболот не постои на еден exchange, се обидува на друг
- Пагинација за долги временски периоди
- Batch insert во база (100 записи одеднаш)
- Автоматско ажурирање на last_sync_date

**Optimizации**:
- ThreadPoolExecutor за паралелни API повици
- Rate limiting за избегнување на API ограничувања
- Overflow заштита за numeric полиња

**Излез**: Статистики за вметнати записи

### Главен Pipeline (`pipeline.py`)

Главниот orchestrator кој ги извршува сите три филтри последователно:

```python
symbols = filter1_get_top_symbols()
symbols_with_dates = filter2_check_last_date(symbols)
stats = filter3_fill_data(symbols_with_dates)
```

**Функционалности**:
- Мерење на перформанси за секој филтер
- Логирање на извршување во база
- Генерирање на детални извештаи
- Чување на резултати во JSON формат

## Конфигурација

Сите параметри се дефинирани во `config.py`:

```python
TOP_CRYPTOS_COUNT = 1000  # Број на криптовалути за собирање
FETCH_PAGES = 4           # 4 страници × 250 = 1000
YEARS_OF_HISTORY = 10     # Години на историски податоци
MIN_VOLUME_24H = 1000     # Минимален 24h волумен (USD)
MIN_MARKET_CAP = 100000   # Минимален market cap (USD)
```

Environment променливи во `.env`:
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

## База на Податоци

Системот користи Supabase (PostgreSQL) со следни табели:

### crypto_data
Главна табела за OHLCV податоци:
- symbol, name, date
- open, high, low, close, volume
- exchange, quote_currency
- timestamps

Composite unique constraint: (symbol, date, exchange)

### crypto_metadata
Metadata за секоја криптовалута:
- symbol (unique), name, rank
- coingecko_id, binance_symbol
- last_sync_date, total_records
- is_active

### pipeline_logs
Лог на извршувања:
- run_id, filter_name, status
- statistics (symbols_processed, records_inserted)
- timing information

## Инсталација

1. Креирање на виртуелно окружување:
```bash
python -m venv venv
venv\Scripts\activate  # Windows
```

2. Инсталација на зависности:
```bash
pip install -r requirements.txt
```

3. Конфигурација на .env:
```bash
SUPABASE_URL=your_url
SUPABASE_KEY=your_key
```

## Користење

### Основно извршување:
```bash
python pipeline.py
```

Pipeline-от ќе:
1. Преземе топ 1000 криптовалути
2. Провери кои податоци недостасуваат
3. Пополни со историски податоци (10 години)
4. Зачува резултати во `pipeline_results.json`

### Тестирање на поединечни филтри:

```bash
# Тестирање на Filter 1
python filter1_get_symbols.py

# Тестирање на Filter 2
python filter2_check_last_date.py

# Тестирање на Filter 3
python filter3_fill_data.py
```

## Дополнителни Скрипти

### daily_update.py

Автономна скрипта за дневни ажурирања. Наменета за извршување преку cron job.

**Функционалности**:
- Проверка на топ 1000 криптовалути
- Ажурирање на рангови доколку има промени
- Инкрементално пополнување на недостасувачки денови
- Fallback од Binance на CoinGecko

**Извршување**:
```bash
python daily_update.py
```

## Перформанси

Системот е оптимизиран за брзина:

- Паралелно преземање на страници (ThreadPoolExecutor)
- Batch queries наместо N+1 queries
- Batch inserts (100 записи одеднаш)
- Rate limiting за спречување на throttling

Типично време за извршување:
- Filter 1: 10-30 секунди
- Filter 2: 5-15 секунди
- Filter 3: зависи од обемот (може да трае неколку часа за 10 години податоци)

## Обработка на Грешки

Системот имплементира робусна обработка на грешки:

- Retry механизми за network грешки
- Fallback на алтернативни exchanges
- Graceful degradation при API failures
- Детално логирање на грешки
- Transaction rollback при критични грешки

## Предности на Pipe and Filter Архитектурата

1. **Модуларност**: Секој филтер е независен и може да се тестира посебно
2. **Проширливост**: Лесно додавање на нови филтри без промена на постоечките
3. **Reusability**: Филтрите може да се користат во различни pipeline-и
4. **Transparency**: Јасен flow на податоци низ системот
5. **Паралелизација**: Различни инстанци може да работат паралелно

## Ограничувања и Идни Подобрувања

### Тековни ограничувања:
- Синхроно извршување на филтри (еден по друг)
- API rate limits ја ограничуваат брзината
- Недостаток на resume механизам при прекин

### Можни подобрувања:
- Имплементација на checkpoint/resume функционалност
- Кеширање на response од API
- Паралелно процесирање на симболи во Filter 3
- Компресија на податоци во база
- Мониторинг dashboard

## Зависности

Главни библиотеки:
- `ccxt` - Unified API за crypto exchanges
- `supabase` - Database client
- `requests` - HTTP библиотека
- `tqdm` - Progress bars
- `python-dotenv` - Environment конфигурација

За комплетна листа видете `requirements.txt`.

## Автор

Домашна работа за курсот Software Design and Architecture, FINKI UКИМ.
