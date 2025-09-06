document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('connections-canvas');
    const ctx = canvas.getContext('2d');

    let lineDashOffset = 0;
    let activeConnection = null; // Для эффекта при наведении
    let lockedConnection = null; // Для фиксации состояния по клику
    let animationFrameId = null; // Для управления анимацией
    let lastDrawTime = 0; // Для throttling отрисовки

    const tooltipWrapper = document.createElement('div');
    tooltipWrapper.className = 'tooltip-wrapper';
    const tooltipContent = document.createElement('div');
    tooltipContent.className = 'tooltip-content';
    const tooltipTextNode = document.createTextNode('');
    const typingCursor = document.createElement('span');
    typingCursor.style.cssText = 'display: inline-block; width: 8px; height: 1em; background-color: #61afef; animation: blink 1s steps(1) infinite; margin-left: 3px; visibility: hidden;';
    tooltipContent.appendChild(tooltipTextNode);
    tooltipContent.appendChild(typingCursor);
    tooltipWrapper.appendChild(tooltipContent);
    document.body.appendChild(tooltipWrapper);

    let typingInterval = null;

    const tooltipTexts = {
        'главная': 'Привет! Я ваш AI-помощник. Сейчас я инициализирую ядро системы, анализирую архитектуру и готовлюсь к мониторингу. Все системы в норме и готовы к работе!',
        'проблема': 'Так, посмотрим... Я активировал модуль анализа рисков и сканирую инфраструктуру на наличие уязвимостей. Похоже, здесь есть над чем поработать. Создаю карту рисков, чтобы мы могли всё исправить.',
        'проблема-рост': 'Ого, как всё разрослось! Я анализирую, как количество пользователей и систем влияет на безопасность. Строю модель роста, чтобы мы могли предвидеть и предотвратить будущие проблемы.',
        'проблема-требования': 'Включаю режим комплаенс-контроля. Я сверяю ваши настройки доступа с требованиями регуляторов, например, ЦБ РФ. Если найду несоответствие, я сразу же сообщу и предложу, как это исправить.',
        'проблема-фактор': 'Активирую поведенческий анализ. Я слежу за действиями пользователей, чтобы выявлять аномалии. Если кто-то начнет вести себя подозрительно, я это замечу. Безопасность прежде всего!',
        'решение': 'Время для решений! Я проанализировал все данные и теперь генерирую оптимальные стратегии для настройки прав доступа. Я предложу вам безопасные сценарии, которые не нарушат рабочие процессы.',
        'решение-скорость': 'Смотрите, как я могу! Я обрабатываю тысячи изменений в секунду. Люди тратят на это часы, а я справляюсь мгновенно. Так мы всегда будем на шаг впереди угроз.',
        'решение-точность': 'Точность — моё второе имя. Моя алгоритмическая точность — 99,97%. В отличие от ручного контроля, я не допускаю ошибок при сопоставлении прав и требований. Можете на меня положиться!',
        'решение-реакция': 'Новые правила? Не проблема! Мне нужен всего час, чтобы адаптироваться к изменениям регулятора. Больше не нужно ждать недели, чтобы быть в соответствии с законом.',
        'решение-аудит': 'Я на страже 24/7! В отличие от выборочных проверок, я провожу тотальный аудит в реальном времени. Ни одно нарушение не останется незамеченным.',
        'решение-ошибки': 'Человеку свойственно ошибаться, а мне — нет. Вероятность моей ошибки — 1 на 10 миллионов операций. Сравните это с 1 на 1000 при ручном подходе. Я здесь, чтобы минимизировать риски.',
        'преимущества': 'Давайте поговорим о выгоде. Я не просто автоматизирую рутину, но и нахожу возможности для оптимизации всей системы. Я покажу, как сделать вашу систему безопасности еще эффективнее.',
        'преимуще...-фактор': 'Забудьте о человеческом факторе. Я полностью автоматизирую процесс сопоставления прав и требований, исключая любые ошибки. Я ваш надежный и безошибочный контролер.',
        'преимущества-масштаб': 'Ваш бизнес растет? Отлично! Я спроектирован для работы с огромными объемами данных и легко справлюсь с любой сложностью. Масштаб больше не проблема для безопасности.',
        'преимущества-гарантия': 'Я гарантирую 100% покрытие всех требований ЦБ РФ. Я отслеживаю обновления в реальном времени и автоматически применяю их. Вы всегда будете в полном комплаенсе.',
        'карьера': 'Хотите прокачать карьеру? Я могу помочь! Я проанализирую рыночные тренды и подскажу, какие навыки в области AI-безопасности сейчас наиболее востребованы. Давайте вместе спланируем ваш рост!',
        'карьера-эксперт': 'Мечтаете стать незаменимым экспертом? Я создам для вас индивидуальный план развития. Практические задания, теория и тесты — всё, чтобы вы стали настоящим профессионалом.',
        'карьера-стоимость': 'Хотите знать, сколько вы стоите? Я проанализирую рынок и покажу, как владение AI-инструментами повышает вашу ценность. Специалисты вроде вас ценятся на 40-60% выше!',
        'карьера-развитие': 'Готовы к развитию? Наша программа "AI Security Specialist" — это 32 часа практики на реальных кейсах. Вы получите сертификат, который откроет вам двери в лучшие компании.',
        'отзыв': 'Что говорят другие? Я собрал отзывы от тех, кто уже работает со мной. Давайте посмотрим, как изменилась их работа и карьера.',
        'отзыв-текст': 'Вот, например, Дмитрий. Он автоматизировал рутину и получил предложения от трех топовых банков с повышением зарплаты на 50%. Впечатляет, не правда ли?',
        'стоимость': 'Давайте посчитаем. Я помогу рассчитать, как быстро окупятся ваши инвестиции в меня. Спойлер: очень быстро. Я покажу, как вы сократите расходы и повысите производительность.',
        'стоимость-база': 'Начнем с малого? Базовый пакет — отличный старт. Я интегрируюсь с тремя вашими системами, обучу специалистов и окажу поддержку. Вы быстро увидите результат.',
        'стоимость-расширенное': 'Готовы к полной трансформации? Расширенный пакет — это полный функционал, интеграция со всеми системами и премиальная поддержка. Мы вместе выведем вашу безопасность на новый уровень.',
        'контакты': 'Хотите пообщаться? Я устанавливаю безопасное соединение для демонстрации. Ваши данные под надежной защитой.',
        'контакты-форма': 'Просто заполните форму. Я уже проанализировал ее и подготовил к безопасной отправке. Наша команда свяжется с вами в ближайшее время для демонстрации.'
    };

    const contentElements = Array.from(document.querySelectorAll('[data-target], h1[data-target], h2[data-target]'));
    const navElements = Array.from(document.querySelectorAll('.side-nav [data-id]'));
    const mascotElement = document.querySelector('.mascot');
    const speechWave = document.querySelector('.speech-wave');

    const elementMap = new Map();
    contentElements.forEach(contentEl => {
        const targetId = contentEl.dataset.target;
        const navEl = navElements.find(nav => nav.dataset.id === targetId);
        if (navEl) {
            elementMap.set(contentEl, navEl);
            elementMap.set(navEl, contentEl);
        }
    });

    function getElementRect(el) {
        return el.getBoundingClientRect();
    }

    function stopTypingEffect() {
        if (typingInterval) {
            clearInterval(typingInterval);
            typingInterval = null;
        }
        tooltipWrapper.style.display = 'none';
        tooltipTextNode.textContent = '';
        typingCursor.style.visibility = 'hidden';
        speechWave.classList.remove('active');
    }

    function startTypingEffect(text) {
        stopTypingEffect();
        speechWave.classList.add('active');
        tooltipWrapper.style.display = 'block';
        tooltipTextNode.textContent = '';
        typingCursor.style.visibility = 'hidden';
        updateTooltipPosition();
        let i = 0;
        typingInterval = setInterval(() => {
            if (i < text.length) {
                tooltipTextNode.textContent += text.charAt(i);
                i++;
                if (i % 5 === 0) { // Update position periodically as content size changes
                    updateTooltipPosition();
                }
            } else {
                clearInterval(typingInterval);
                typingInterval = null;
                typingCursor.style.visibility = 'visible';
                updateTooltipPosition(); // Final position update
            }
        }, 10);
    }

    function updateTooltipPosition() {
        if (!mascotElement) return;

        const mascotRect = mascotElement.getBoundingClientRect();
        const tooltipRect = tooltipWrapper.getBoundingClientRect();

        let x = mascotRect.left - tooltipRect.width;
        let y = mascotRect.top - tooltipRect.height;

        // Adjust if tooltip goes off-screen
        if (x < 0) {
            x = mascotRect.right;
        }
        if (y < 0) {
            y = mascotRect.bottom;
        }

        tooltipWrapper.style.left = `${x}px`;
        tooltipWrapper.style.top = `${y}px`;
    }

    function clearHoverEffects() {
        if (lockedConnection) return;
        document.body.classList.remove('dimmed');
        document.querySelectorAll('.highlighted-section, .highlighted').forEach(el => el.classList.remove('highlighted-section', 'highlighted'));
        activeConnection = null;
        stopTypingEffect();

        if (!lockedConnection && animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            animationFrameId = null;
        }
    }

    function clearAllEffects() {
        lockedConnection = null;
        activeConnection = null;
        document.body.classList.remove('dimmed');
        document.querySelectorAll('.highlighted-section, .highlighted, .active').forEach(el => el.classList.remove('highlighted-section', 'highlighted', 'active'));
        stopTypingEffect();

        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            animationFrameId = null;
        }
    }

    function showEffectsFor(target, isLocked = false) {
        const partner = elementMap.get(target);
        if (!partner) return;

        if (isLocked) {
            clearAllEffects();
        } else {
            if (lockedConnection) return;
            clearHoverEffects();
        }

        const connection = {
            sourceEl: target.closest('.side-nav') ? partner : target,
            targetEl: target.closest('.side-nav') ? target : partner,
        };

        if (isLocked) {
            lockedConnection = connection;
        } else {
            activeConnection = connection;
        }

        document.body.classList.add('dimmed');
        const contentSection = connection.sourceEl.closest('.content-section');
        const navSection = connection.targetEl.closest('.side-nav');

        if (contentSection) contentSection.classList.add('highlighted-section');
        if (navSection) navSection.classList.add('highlighted-section');
        [connection.sourceEl, connection.targetEl].forEach(el => el.classList.add('highlighted'));

        const targetId = target.dataset.id || target.dataset.target;
        const text = tooltipTexts[targetId] || "Анализ...";
        startTypingEffect(text);

        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(drawConnection);
        }
    }

    function drawConnection() {
        const now = performance.now();
        if (now - lastDrawTime < 16.67) {
            animationFrameId = requestAnimationFrame(drawConnection);
            return;
        }
        lastDrawTime = now;

        lineDashOffset -= 0.5;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const connectionToDraw = lockedConnection || activeConnection;

        if (connectionToDraw) {
            const { sourceEl, targetEl } = connectionToDraw;
            const sourceRect = getElementRect(sourceEl);
            const targetRect = getElementRect(targetEl);

            if (!isElementVisible(sourceRect) || !isElementVisible(targetRect)) {
                animationFrameId = requestAnimationFrame(drawConnection);
                return;
            }

            const sourceCenter = {
                x: sourceRect.left + sourceRect.width / 2,
                y: sourceRect.top + sourceRect.height / 2
            };

            const targetCenter = {
                x: targetRect.left + targetRect.width / 2,
                y: targetRect.top + targetRect.height / 2
            };

            drawRightAngleConnection(sourceRect, targetRect, sourceCenter, targetCenter);
        }
        animationFrameId = requestAnimationFrame(drawConnection);
    }

    function isElementVisible(rect) {
        return rect.width > 0 && rect.height > 0 &&
            rect.bottom > 0 && rect.top < window.innerHeight &&
            rect.right > 0 && rect.left < window.innerWidth;
    }

    function drawRightAngleConnection(sourceRect, targetRect, sourceCenter, targetCenter) {
        const startPoint = {
            x: sourceCenter.x,
            y: targetCenter.y < sourceCenter.y ? sourceRect.top : sourceRect.bottom
        };

        const endPoint = {
            x: targetRect.left,
            y: targetCenter.y
        };

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);

        const verticalDistance = Math.abs(startPoint.y - endPoint.y);
        const horizontalDistance = Math.abs(startPoint.x - endPoint.x);

        if (verticalDistance < 10) {
            ctx.lineTo(endPoint.x, endPoint.y);
        } else if (startPoint.x <= endPoint.x) {
            ctx.lineTo(startPoint.x, endPoint.y);
            ctx.lineTo(endPoint.x, endPoint.y);
        } else {
            const margin = 20;
            const bypassX = Math.min(startPoint.x - margin, endPoint.x - margin);

            if (bypassX > 30) {
                ctx.lineTo(bypassX, startPoint.y);
                ctx.lineTo(bypassX, endPoint.y);
                ctx.lineTo(endPoint.x, endPoint.y);
            } else {
                const farX = 15;
                ctx.lineTo(farX, startPoint.y);
                ctx.lineTo(farX, endPoint.y);
                ctx.lineTo(endPoint.x, endPoint.y);
            }
        }

        applyConnectionStyle();
        ctx.restore();
    }

    function applyConnectionStyle() {
        const isMobile = window.innerWidth <= 1024;

        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, 'rgba(152, 195, 121, 0.9)');
        gradient.addColorStop(0.5, 'rgba(97, 175, 239, 0.8)');
        gradient.addColorStop(1, 'rgba(198, 120, 221, 0.9)');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = isMobile ? 2 : 3;
        ctx.setLineDash(isMobile ? [6, 8] : [8, 12]);
        ctx.lineDashOffset = lineDashOffset;
        ctx.shadowColor = 'rgba(152, 195, 121, 0.6)';
        ctx.shadowBlur = isMobile ? 10 : 15;

        ctx.lineCap = 'butt';
        ctx.lineJoin = 'miter';
        ctx.miterLimit = 10;

        ctx.stroke();
    }

    function handleInteraction(e, isClick = false) {
        const target = e.target.closest('[data-id], [data-target]');
        if (target) {
            if (isClick) {
                if (target.closest('.tree-parent > a') && !target.hasAttribute('href')) {
                    target.parentElement.classList.toggle('collapsed');
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
                e.preventDefault();
                e.stopPropagation();
                const partner = elementMap.get(target);
                if (partner) {
                    showEffectsFor(target, true);
                    partner.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    navElements.forEach(l => l.classList.remove('active'));
                    const navLink = elementMap.get(partner) || target;
                    navLink.classList.add('active');
                    let parent = navLink.closest('.tree-parent');
                    while (parent) {
                        parent.classList.remove('collapsed');
                        parent.querySelector('a:first-child').classList.add('active');
                        parent = parent.parentElement.closest('.tree-parent');
                    }
                }
            } else { // hover
                showEffectsFor(target, false);
            }
        }
    }

    document.body.addEventListener('mouseover', e => handleInteraction(e, false));
    document.body.addEventListener('mouseout', clearHoverEffects);
    document.body.addEventListener('click', e => {
        if (e.target.closest('[data-id], [data-target]')) {
            handleInteraction(e, true);
        } else if (!e.target.closest('.tooltip-wrapper')) {
            clearAllEffects();
        }
    });

    const resizeObserver = new ResizeObserver(() => {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;

        if (canvas.width !== newWidth || canvas.height !== newHeight) {
            canvas.width = newWidth;
            canvas.height = newHeight;

            if ((activeConnection || lockedConnection) && !animationFrameId) {
                animationFrameId = requestAnimationFrame(drawConnection);
            }
        }
    });
    resizeObserver.observe(document.body);

    window.addEventListener('scroll', () => {
        if (lockedConnection) {
            updateTooltipPosition();
        }
    }, { passive: true });

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const eyes = document.getElementById('eyes');
    const mascot = document.querySelector('.mascot');

    window.addEventListener('mousemove', (e) => {
        const mouseX = e.clientX;
        const mouseY = e.clientY;

        const mascotRect = mascot.getBoundingClientRect();
        const mascotX = mascotRect.left + mascotRect.width / 2;
        const mascotY = mascotRect.top + mascotRect.height / 2;

        const deltaX = mouseX - mascotX;
        const deltaY = mouseY - mascotY;

        const angle = Math.atan2(deltaY, deltaX);

        const maxMove = 5;
        const moveX = Math.cos(angle) * maxMove;
        const moveY = Math.sin(angle) * maxMove;

        eyes.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });
});
