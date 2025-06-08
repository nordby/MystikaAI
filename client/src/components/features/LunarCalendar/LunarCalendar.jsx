// client/src/components/features/LunarCalendar/LunarCalendar.jsx
import React, { useState, useEffect } from 'react';
import { MOON_PHASES, LUNAR_ZODIAC, LUNAR_DAYS } from '../../../shared/constants/lunar';
import { Button } from '../../common/Button';
import './LunarCalendar.css';

const LunarCalendar = ({ selectedDate = new Date(), onDateSelect, showDetails = true }) => {
    const [currentDate, setCurrentDate] = useState(selectedDate);
    const [lunarData, setLunarData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        calculateLunarData(currentDate);
    }, [currentDate]);

    const calculateLunarData = async (date) => {
        setIsLoading(true);
        try {
            // Здесь должен быть API вызов для получения точных лунных данных
            // Пока используем приблизительные вычисления
            const lunarDay = calculateLunarDay(date);
            const moonPhase = calculateMoonPhase(date);
            const zodiacSign = calculateLunarZodiac(date);
            
            setLunarData({
                date: date,
                lunarDay: lunarDay,
                moonPhase: moonPhase,
                zodiacSign: zodiacSign,
                moonPhaseData: MOON_PHASES[moonPhase],
                zodiacData: LUNAR_ZODIAC[zodiacSign],
                lunarDayData: LUNAR_DAYS[lunarDay] || null
            });
        } catch (error) {
            console.error('Ошибка расчета лунных данных:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const calculateLunarDay = (date) => {
        // Приблизительный расчет лунного дня
        const newMoonReference = new Date('2024-01-11'); // Эталонное новолуние
        const daysDiff = Math.floor((date - newMoonReference) / (1000 * 60 * 60 * 24));
        const lunarCycle = 29.53; // Лунный цикл в днях
        const lunarDay = (daysDiff % lunarCycle) + 1;
        return Math.floor(lunarDay);
    };

    const calculateMoonPhase = (date) => {
        const lunarDay = calculateLunarDay(date);
        if (lunarDay === 1) return 'NEW_MOON';
        if (lunarDay <= 7) return 'WAXING_CRESCENT';
        if (lunarDay === 8) return 'FIRST_QUARTER';
        if (lunarDay <= 14) return 'WAXING_GIBBOUS';
        if (lunarDay === 15) return 'FULL_MOON';
        if (lunarDay <= 21) return 'WANING_GIBBOUS';
        if (lunarDay === 22) return 'LAST_QUARTER';
        return 'WANING_CRESCENT';
    };

    const calculateLunarZodiac = (date) => {
        // Упрощенный расчет знака зодиака для Луны
        // В реальности требуются эфемериды
        const zodiacSigns = ['ARIES', 'TAURUS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO', 
                           'LIBRA', 'SCORPIO', 'SAGITTARIUS', 'CAPRICORN', 'AQUARIUS', 'PISCES'];
        const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
        const signIndex = Math.floor((dayOfYear / 30.44) % 12);
        return zodiacSigns[signIndex];
    };

    const navigateDate = (direction) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + direction);
        setCurrentDate(newDate);
        onDateSelect && onDateSelect(newDate);
    };

    const selectToday = () => {
        const today = new Date();
        setCurrentDate(today);
        onDateSelect && onDateSelect(today);
    };

    if (isLoading) {
        return (
            <div className="lunar-calendar lunar-calendar--loading">
                <div className="lunar-calendar__spinner">
                    <div className="moon-loading">🌙</div>
                    <p>Вычисляю лунные данные...</p>
                </div>
            </div>
        );
    }

    if (!lunarData) {
        return (
            <div className="lunar-calendar lunar-calendar--error">
                <p>Не удалось загрузить лунные данные</p>
                <Button onClick={() => calculateLunarData(currentDate)}>
                    Попробовать снова
                </Button>
            </div>
        );
    }

    const { moonPhaseData, zodiacData, lunarDayData } = lunarData;

    return (
        <div className="lunar-calendar">
            <div className="lunar-calendar__header">
                <Button 
                    variant="ghost" 
                    size="small"
                    onClick={() => navigateDate(-1)}
                    className="lunar-calendar__nav"
                >
                    ←
                </Button>
                
                <div className="lunar-calendar__date">
                    <h3>{currentDate.toLocaleDateString('ru-RU', { 
                        weekday: 'long',
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}</h3>
                    <p className="lunar-day">Лунный день: {lunarData.lunarDay}</p>
                </div>
                
                <Button 
                    variant="ghost" 
                    size="small"
                    onClick={() => navigateDate(1)}
                    className="lunar-calendar__nav"
                >
                    →
                </Button>
            </div>

            <div className="lunar-calendar__content">
                {/* Фаза Луны */}
                <div className="lunar-phase">
                    <div className="lunar-phase__visual">
                        <span className="moon-symbol">{moonPhaseData.symbol}</span>
                        <div className="moon-phase-name">{moonPhaseData.name}</div>
                    </div>
                    <div className="lunar-phase__info">
                        <p className="phase-energy">{moonPhaseData.energy}</p>
                        <p className="phase-description">{moonPhaseData.description}</p>
                    </div>
                </div>

                {/* Знак зодиака */}
                <div className="lunar-zodiac">
                    <div className="zodiac-header">
                        <h4>{zodiacData.name}</h4>
                        <span className="zodiac-element">Стихия: {zodiacData.element}</span>
                    </div>
                    <p className="zodiac-energy">{zodiacData.energy}</p>
                    <p className="zodiac-recommendation">{zodiacData.recommendations}</p>
                </div>

                {showDetails && (
                    <div className="lunar-details">
                        {/* Рекомендации */}
                        <div className="lunar-recommendations">
                            <div className="recommendations-section">
                                <h5>🌟 Рекомендуется:</h5>
                                <ul>
                                    {moonPhaseData.activities.recommended.slice(0, 4).map((activity, index) => (
                                        <li key={index}>{activity}</li>
                                    ))}
                                </ul>
                            </div>
                            
                            <div className="recommendations-section">
                                <h5>⚠️ Избегать:</h5>
                                <ul>
                                    {moonPhaseData.activities.avoid.slice(0, 3).map((activity, index) => (
                                        <li key={index}>{activity}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Кристаллы и цвета */}
                        <div className="lunar-attributes">
                            <div className="attribute-group">
                                <h5>💎 Кристаллы:</h5>
                                <div className="crystal-list">
                                    {moonPhaseData.crystals.map((crystal, index) => (
                                        <span key={index} className="crystal-tag">{crystal}</span>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="attribute-group">
                                <h5>🎨 Цвета:</h5>
                                <div className="color-list">
                                    {moonPhaseData.colors.map((color, index) => (
                                        <span key={index} className="color-tag" style={{backgroundColor: color}}>
                                            {color}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Особый лунный день */}
                        {lunarDayData && (
                            <div className="special-lunar-day">
                                <h5>✨ {lunarDayData.name}</h5>
                                <p>{lunarDayData.energy}</p>
                                <div className="lunar-day-activities">
                                    <div>
                                        <strong>Рекомендуется:</strong> {lunarDayData.activities.join(', ')}
                                    </div>
                                    <div>
                                        <strong>Избегать:</strong> {lunarDayData.avoid.join(', ')}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="lunar-calendar__actions">
                <Button 
                    variant="outline" 
                    onClick={selectToday}
                    disabled={currentDate.toDateString() === new Date().toDateString()}
                >
                    📅 Сегодня
                </Button>
                
                <Button 
                    variant="primary"
                    onClick={() => {/* Открыть полный календарь */}}
                >
                    🗓️ Полный календарь
                </Button>
            </div>
        </div>
    );
};

export default LunarCalendar;