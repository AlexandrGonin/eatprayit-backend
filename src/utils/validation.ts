// Утилиты для валидации ссылок
export class LinkValidator {
  private static allowedDomains = {
    telegram: ['t.me', 'telegram.me'],
    linkedin: ['linkedin.com', 'www.linkedin.com'],
    vk: ['vk.com', 'vkontakte.ru', 'www.vk.com'],
    instagram: ['instagram.com', 'www.instagram.com']
  };

  // Проверяет что ссылка принадлежит разрешенному домену
  static validateLink(type: string, url: string): string {
    if (!url.trim()) return '';

    let processedUrl = url.trim();
    
    // Добавляем https:// если нет протокола
    if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
      processedUrl = 'https://' + processedUrl;
    }

    try {
      const urlObj = new URL(processedUrl);
      const domain = urlObj.hostname.toLowerCase();

      // Проверяем домен в зависимости от типа ссылки
      switch (type) {
        case 'telegram':
          if (this.allowedDomains.telegram.includes(domain)) {
            return processedUrl;
          }
          // Для телеграма также разрешаем @username форматы
          if (url.startsWith('@') || !url.includes('.') || url.includes('t.me/')) {
            return this.formatTelegramLink(url);
          }
          break;

        case 'linkedin':
          if (this.allowedDomains.linkedin.includes(domain)) {
            return processedUrl;
          }
          break;

        case 'vk':
          if (this.allowedDomains.vk.includes(domain)) {
            return processedUrl;
          }
          break;

        case 'instagram':
          if (this.allowedDomains.instagram.includes(domain)) {
            return processedUrl;
          }
          break;
      }

      throw new Error(`Недопустимый домен для ${type}`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid URL';
      throw new Error(`Невалидная ссылка для ${type}: ${url}. ${errorMessage}`);
    }
  }

  // Форматирует телеграм ссылки
  private static formatTelegramLink(username: string): string {
    let cleanUsername = username.trim();
    
    // Убираем @ в начале
    if (cleanUsername.startsWith('@')) {
      cleanUsername = cleanUsername.slice(1);
    }
    
    // Убираем протокол и домен если есть
    if (cleanUsername.includes('t.me/')) {
      cleanUsername = cleanUsername.split('t.me/')[1];
    }
    if (cleanUsername.includes('telegram.me/')) {
      cleanUsername = cleanUsername.split('telegram.me/')[1];
    }
    
    // Убираем слеши
    cleanUsername = cleanUsername.replace(/\//g, '');
    
    return `https://t.me/${cleanUsername}`;
  }

  // Проверяет все ссылки пользователя
  static validateUserLinks(links: any): any {
    const validatedLinks: any = {};
    
    if (links.telegram) {
      try {
        validatedLinks.telegram = this.validateLink('telegram', links.telegram);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Ошибка в Telegram ссылке: ${errorMessage}`);
      }
    }

    if (links.linkedin) {
      try {
        validatedLinks.linkedin = this.validateLink('linkedin', links.linkedin);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Ошибка в LinkedIn ссылке: ${errorMessage}`);
      }
    }

    if (links.vk) {
      try {
        validatedLinks.vk = this.validateLink('vk', links.vk);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Ошибка в VK ссылке: ${errorMessage}`);
      }
    }

    if (links.instagram) {
      try {
        validatedLinks.instagram = this.validateLink('instagram', links.instagram);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Ошибка в Instagram ссылке: ${errorMessage}`);
      }
    }

    return validatedLinks;
  }
}