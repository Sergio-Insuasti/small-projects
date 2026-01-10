import pygame as pg
import random

SCREEN_WIDTH = 960
SCREEN_HEIGHT = 720

COLOR_BLACK = (0, 0, 0)
COLOR_WHITE = (255, 255, 255)

def main(): 
  pg.init()

  screen = pg.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
  
  pg.display.set_caption('PONG')

  clock = pg.time.Clock()
  
  started = False
  
  paddle_1_rect = pg.Rect(30, 0, 7, 100)
  paddle_2_rect = pg.Rect(SCREEN_WIDTH - 50, 0, 7, 100)

  paddle_1_move = 0
  paddle_2_move = 0

  ball_rect = pg.Rect(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, 25, 25)

  ball_accel_x = random.randint(2, 4) * 0.1
  ball_accel_y = random.randint(2, 4) * 0.1

  if random.randint(1, 2) == 1:
    ball_accel_x *= -1
  if random.randint(1, 2) == 1:
    ball_accel_y *= -1

  while True:
    screen.fill(COLOR_BLACK)
    
    if not started:
      font = pg.font.SysFont('Consolas', 30)
      
      text = font.render('Press Space to Start', True, COLOR_WHITE)
      text_rect = text.get_rect()
      text_rect.center = (SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2)
      screen.blit(text, text_rect)
      
      pg.display.flip()
      clock.tick(60)

      for event in pg.event.get():
        if event.type == pg.QUIT:
          pg.quit()
          return
        if event.type == pg.KEYDOWN:
          if event.key == pg.K_SPACE:
            started = True

    delta_time = clock.tick(60)

    for event in pg.event.get():
        if event.type == pg.QUIT:
            pg.quit()
            return
        if event.type == pg.KEYDOWN:
            if event.key == pg.K_w:
                paddle_1_move = -0.5
            if event.key == pg.K_s:
                paddle_1_move = 0.5
            if event.key == pg.K_UP:
                paddle_2_move = -0.5
            if event.key == pg.K_DOWN:
                paddle_2_move = 0.5
        if event.type == pg.KEYUP:
            if event.key == pg.K_w or event.key == pg.K_s:
                paddle_1_move = 0.0
            if event.key == pg.K_UP or event.key == pg.K_DOWN:
                paddle_2_move = 0.0
    paddle_1_rect.top += paddle_1_move * delta_time
    paddle_2_rect.top += paddle_2_move * delta_time

    if paddle_1_rect.top < 0:
       paddle_1_rect.top = 0
    if paddle_1_rect.bottom > SCREEN_HEIGHT:
       paddle_1_rect.bottom = SCREEN_HEIGHT
    if paddle_2_rect.top < 0:
       paddle_1_rect.top = 0
    if paddle_2_rect.bottom > SCREEN_HEIGHT:
       paddle_2_rect.bottom = SCREEN_HEIGHT

    if ball_rect.left <= 0 or ball_rect.left >= SCREEN_WIDTH: return  

    if ball_rect.top < 0:
        ball_accel_y *= -1
        ball_rect.top = 0
    if ball_rect.bottom > SCREEN_HEIGHT:
        ball_accel_y *= -1
        ball_rect.top = SCREEN_HEIGHT - ball_rect.height

    if paddle_1_rect.colliderect(ball_rect) and paddle_1_rect.left < ball_rect.left:
        ball_accel_x *= -1
        ball_rect.left += 5
      
    if paddle_2_rect.colliderect(ball_rect) and paddle_2_rect.left > ball_rect.left:
        ball_accel_x *= -1
        ball_rect.left -= 5
    
    if started:
        ball_rect.left += ball_accel_x * delta_time
        ball_rect.top += ball_accel_y * delta_time


    pg.draw.rect(screen, COLOR_WHITE, paddle_1_rect)
    pg.draw.rect(screen, COLOR_WHITE, paddle_2_rect)

    # draw the ball with the white color
    pg.draw.rect(screen, COLOR_WHITE, ball_rect)

    # update the display (this is necessary for pg)
    pg.display.update()

# run the game
if __name__ == '__main__':
  main()