import pygame
import sys
import random
import os

# --- Initialization ---
pygame.init()
WIDTH, HEIGHT = 800, 600
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Coin Collector - Hero Selection")
clock = pygame.time.Clock()

# Color Definitions
WHITE = (255, 255, 255)
SKY_BLUE = (135, 206, 235)
GOLD = (255, 215, 0)
BLACK = (0, 0, 0)
GRAY = (200, 200, 200)
RED = (255, 50, 50)
GREEN = (50, 200, 50)

# --- Asset Path Settings ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ASSETS_DIR = os.path.join(BASE_DIR, "assets")

if not os.path.exists(ASSETS_DIR):
    os.makedirs(ASSETS_DIR)

def load_image(filename, size=None):
    """ 安全載入圖片的工具函數 """
    path = os.path.join(ASSETS_DIR, filename)
    try:
        image = pygame.image.load(path).convert_alpha()
        if size:
            image = pygame.transform.scale(image, size)
        return image
    except (pygame.error, FileNotFoundError):
        return None

# Character Info
CHARACTERS = [
    {"name": "Cat", "color": (255, 50, 50), "img_file": "103643387.webp"},
    {"name": "Cute", "color": (50, 255, 50), "img_file": "images.jpg"},
    {"name": "Ghost", "color": (50, 50, 255), "img_file": "player_blue.png"}
]

# Fonts
# 使用系統字體列表以支援中文顯示
font = pygame.font.SysFont(['microsoftjhenghei', 'arialunicode', 'stheititclight', 'arial'], 36)
title_font = pygame.font.SysFont(['microsoftjhenghei', 'arialunicode', 'arial'], 64)
result_font = pygame.font.SysFont(['microsoftjhenghei', 'arialunicode', 'stheititclight'], 100)
small_font = pygame.font.SysFont(['microsoftjhenghei', 'arialunicode', 'arial'], 28)

def show_character_selection():
    """ 顯示角色選擇畫面，包含圖片預覽 """
    selecting = True
    selected_index = 0
    
    # 預先載入選擇畫面要用的角色預覽圖 (100x100)
    preview_images = []
    for char in CHARACTERS:
        img = load_image(char["img_file"], (100, 100))
        preview_images.append(img)

    while selecting:
        screen.fill(SKY_BLUE)
        title_text = title_font.render("Choose Your Hero", True, BLACK)
        screen.blit(title_text, (WIDTH // 2 - title_text.get_width() // 2, 80))

        char_rects = []
        for i, char in enumerate(CHARACTERS):
            # 計算位置
            x = (WIDTH // (len(CHARACTERS) + 1)) * (i + 1) - 50
            y = HEIGHT // 2 - 50
            rect = pygame.Rect(x, y, 100, 100)
            char_rects.append(rect)

            # 繪製背景方塊 (若圖片載入失敗時可以看到顏色)
            pygame.draw.rect(screen, char["color"], rect, border_radius=15)
            
            # 繪製角色圖片
            if preview_images[i]:
                screen.blit(preview_images[i], (x, y))
            
            # 繪製選取框 (選中時邊框變粗)
            border_weight = 5 if i == selected_index else 1
            pygame.draw.rect(screen, BLACK, rect, border_weight, border_radius=15)

            # 繪製角色名稱
            name_text = font.render(char["name"], True, BLACK)
            screen.blit(name_text, (x + 50 - name_text.get_width() // 2, y + 110))

        hint_text = font.render("Use Arrow Keys, Press Enter to Start", True, BLACK)
        screen.blit(hint_text, (WIDTH // 2 - hint_text.get_width() // 2, HEIGHT - 100))

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit(); sys.exit()
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_LEFT:
                    selected_index = (selected_index - 1) % len(CHARACTERS)
                elif event.key == pygame.K_RIGHT:
                    selected_index = (selected_index + 1) % len(CHARACTERS)
                elif event.key == pygame.K_RETURN:
                    return selected_index
            if event.type == pygame.MOUSEBUTTONDOWN:
                for i, rect in enumerate(char_rects):
                    if rect.collidepoint(event.pos):
                        return i

        pygame.display.flip()
        clock.tick(60)

# --- 開始遊戲流程 ---

# 1. 選擇角色
selected_char_idx = show_character_selection()
selected_char_info = CHARACTERS[selected_char_idx]

# 2. 初始化遊戲物件
PLAYER_SIZE = 50
player_image = load_image(selected_char_info["img_file"], (PLAYER_SIZE, PLAYER_SIZE))
player_color = selected_char_info["color"]
coin_image = load_image("coin.png", (45, 45))

player_x = WIDTH // 2
player_y = HEIGHT - PLAYER_SIZE - 10
player_speed = 8
is_jumping = False
jump_speed = -18
gravity = 0.8
vertical_velocity = 0
ground_y = HEIGHT - PLAYER_SIZE - 10

coins = []
score = 0
game_over = False
show_retry_dialog = False # 是否顯示詢問對話框
game_over_time = 0 # 紀錄遊戲結束的時間點
start_ticks = pygame.time.get_ticks() 
TOTAL_TIME = 45 # 將遊戲時間從 60 秒改為 45 秒

def reset_game():
    global score, coins, start_ticks, game_over, show_retry_dialog, player_x, player_y
    score = 0
    coins = []
    start_ticks = pygame.time.get_ticks()
    game_over = False
    show_retry_dialog = False
    player_x = WIDTH // 2
    player_y = ground_y

# --- Main Game Loop ---
running = True
while running:
    mouse_pos = pygame.mouse.get_pos()
    
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        
        # 處理滑鼠點擊 (用於重新開始對話框)
        if show_retry_dialog and event.type == pygame.MOUSEBUTTONDOWN:
            # 「繼續玩」按鈕判定
            if retry_btn_rect.collidepoint(event.pos):
                reset_game()
            # 「關閉遊戲」按鈕判定
            if quit_btn_rect.collidepoint(event.pos):
                running = False

    if not game_over:
        # 1. 計時邏輯
        seconds_passed = (pygame.time.get_ticks() - start_ticks) // 1000
        time_left = max(0, TOTAL_TIME - seconds_passed)

        if time_left <= 0:
            game_over = True
            game_over_time = pygame.time.get_ticks() # 記錄結束瞬間的時間

        # 2. 玩家移動
        keys = pygame.key.get_pressed()
        if (keys[pygame.K_LEFT] or keys[pygame.K_a]) and player_x > 0:
            player_x -= player_speed
        if (keys[pygame.K_RIGHT] or keys[pygame.K_d]) and player_x < WIDTH - PLAYER_SIZE:
            player_x += player_speed
        if (keys[pygame.K_SPACE] or keys[pygame.K_UP]) and not is_jumping:
            vertical_velocity = jump_speed
            is_jumping = True

        # 3. 跳躍物理
        if is_jumping:
            vertical_velocity += gravity
            player_y += vertical_velocity
            if player_y >= ground_y:
                player_y = ground_y
                is_jumping = False

        # 4. 金幣生成與碰撞
        if random.randint(1, 30) == 1:
            coins.append(pygame.Rect(random.randint(0, WIDTH - 45), -50, 45, 45))

        player_rect = pygame.Rect(player_x, player_y, PLAYER_SIZE, PLAYER_SIZE)
        for coin in coins[:]:
            coin.y += 5
            if player_rect.colliderect(coin):
                coins.remove(coin)
                score += 10
            elif coin.y > HEIGHT:
                coins.remove(coin)

        # 5. 繪製遊戲畫面
        screen.fill(SKY_BLUE)
        
        if player_image:
            screen.blit(player_image, (player_x, player_y))
        else:
            pygame.draw.rect(screen, player_color, player_rect, border_radius=8)

        for coin in coins:
            if coin_image:
                screen.blit(coin_image, (coin.x, coin.y))
            else:
                pygame.draw.circle(screen, GOLD, coin.center, 22)
                pygame.draw.circle(screen, BLACK, coin.center, 22, 2)

        # UI 顯示
        score_text = font.render(f"Score: {score}", True, BLACK)
        timer_color = RED if time_left <= 10 else BLACK
        timer_text = font.render(f"Time: {time_left}s", True, timer_color)
        screen.blit(score_text, (20, 20))
        screen.blit(timer_text, (WIDTH - 150, 20))

    else:
        # --- 遊戲結束流程 ---
        screen.fill(GRAY)
        
        # 計算距離結束過了幾秒
        wait_seconds_passed = (pygame.time.get_ticks() - game_over_time) // 1000
        wait_time_left = max(0, 3 - wait_seconds_passed) # 改為 3 秒倒數

        if wait_time_left > 0 and not show_retry_dialog:
            # 畫面 A：顯示評語並倒數 3 秒
            if score < 300: comment = "你好菜"
            elif score <= 500: comment = "還行"
            else: comment = "不錯"

            comment_surf = result_font.render(comment, True, BLACK)
            score_surf = font.render(f"Total Score: {score}", True, BLACK)
            wait_surf = small_font.render(f"請稍候... {wait_time_left} 秒後顯示選單", True, RED)

            screen.blit(comment_surf, (WIDTH//2 - comment_surf.get_width()//2, HEIGHT//2 - 100))
            screen.blit(score_surf, (WIDTH//2 - score_surf.get_width()//2, HEIGHT//2 + 20))
            screen.blit(wait_surf, (WIDTH//2 - wait_surf.get_width()//2, HEIGHT//2 + 100))
        else:
            # 畫面 B：詢問是否再玩一次
            show_retry_dialog = True
            
            # 渲染文字
            ask_text = font.render("請問是否要再玩一次？", True, BLACK)
            screen.blit(ask_text, (WIDTH//2 - ask_text.get_width()//2, HEIGHT//2 - 120))

            # 按鈕設定 (定義區域以便偵測點擊與 Hover)
            retry_btn_rect = pygame.Rect(WIDTH//2 - 160, HEIGHT//2 - 20, 140, 60)
            quit_btn_rect = pygame.Rect(WIDTH//2 + 20, HEIGHT//2 - 20, 140, 60)

            # 繪製按鈕 (Hover 時變色，增加互動感)
            retry_color = GREEN if retry_btn_rect.collidepoint(mouse_pos) else BLACK
            quit_color = RED if quit_btn_rect.collidepoint(mouse_pos) else BLACK

            pygame.draw.rect(screen, retry_color, retry_btn_rect, border_radius=10)
            pygame.draw.rect(screen, quit_color, quit_btn_rect, border_radius=10)

            # 按鈕文字
            retry_text = font.render("繼續玩", True, WHITE)
            quit_text = font.render("關閉遊戲", True, WHITE)

            screen.blit(retry_text, (retry_btn_rect.centerx - retry_text.get_width()//2, retry_btn_rect.centery - retry_text.get_height()//2))
            screen.blit(quit_text, (quit_btn_rect.centerx - quit_text.get_width()//2, quit_btn_rect.centery - quit_text.get_height()//2))

    pygame.display.flip()
    clock.tick(60)

pygame.quit()
sys.exit()