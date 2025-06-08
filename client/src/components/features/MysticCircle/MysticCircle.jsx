// client/src/components/features/MysticCircle/MysticCircle.jsx
import React, { useState, useEffect, useRef } from 'react';
import { NUMEROLOGY_NUMBERS } from '../../../shared/constants/numerology';
import { MOON_PHASES } from '../../../shared/constants/lunar';
import { Button } from '../../common/Button';
import './MysticCircle.css';

const MysticCircle = ({ 
    userBirthDate, 
    currentQuestion, 
    onReading,
    showAnimation = true 
}) => {
    const [isActive, setIsActive] = useState(false);
    const [mysticData, setMysticData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeElements, setActiveElements] = useState([]);
    const circleRef = useRef(null);

    const mysticElements = [
        { id: 'fire', name: 'Огонь', symbol: '🔥', color: '#ff4444', energy: 'Действие' },
        { id: 'water', name: 'Вода', symbol: '💧', color: '#4488ff', energy: 'Эмоции' },
        { id: 'earth', name: 'Земля', symbol: '🌍', color: '#44aa44', energy: 'Стабильность' },
        { id: 'air', name: 'Воздух', symbol: '💨', color: '#ffaa44', energy: 'Мысли' },
        { id: 'spirit', name: 'Дух', symbol: '✨', color: '#aa44ff', energy: 'Интуиция' },
        { id: 'moon', name: 'Луна', symbol: '🌙', color: '#aaccff', energy: 'Циклы' },
        { id: 'sun', name: 'Солнце', symbol: '☀️', color: '#ffcc44', energy: 'Сила' },
        { id: 'star', name: 'Звезды', symbol: '⭐', color: '#ccaaff', energy: 'Судьба' }
    ];

    useEffect(() => {
        if (userBirthDate) {
            calculatePersonalElements();
        }
    }, [userBirthDate]);

    const calculatePersonalElements = () => {
        if (!userBirthDate) return;
        
        const birthNumber = calculateLifePathNumber(userBirthDate);
        const elementWeights = calculateElementalBalance(userBirthDate, birthNumber);
        
        setActiveElements(elementWeights);
    };

    const calculateLifePathNumber = (birthDate) => {
        const date = new Date(birthDate);
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        
        let sum = day + month + year;
        while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
            sum = sum.toString().split('').reduce((a, b) => parseInt(a) + parseInt(b), 0);
        }
        
        return sum;
    };

    const calculateElementalBalance = (birthDate, lifePathNumber) => {
        const weights = {};
        
        // Расчет весов элементов на основе даты рождения и нумерологии
        mysticElements.forEach((element, index) => {
            const baseWeight = (lifePathNumber + index) % 10;
            const dateInfluence = new Date(birthDate).getDay();
            weights[element.id] = (baseWeight + dateInfluence) % 8 + 1;
        });
        
        return weights;
    };

    const activateMysticCircle = async () => {
        setIsLoading(true);
        setIsActive(true);
        
        try {
            // Анимация активации элементов
            if (showAnimation) {
                for (let i = 0; i < mysticElements.length; i++) {
                    setTimeout(() => {
                        const elementDiv = document.getElementById(`element-${mysticElements[i].id}`);
                        if (elementDiv) {
                            elementDiv.classList.add('mystic-element--active');
                        }
                    }, i * 200);
                }
            }
            
            // Симуляция времени для мистических вычислений
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const reading = await generateMysticReading();
            setMysticData(reading);
            onReading && onReading(reading);
            
        } catch (error) {
            console.error('Ошибка создания мистического круга:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const generateMysticReading = async () => {
        const dominantElement = findDominantElement();
        const secondaryElement = findSecondaryElement();
        const energyReading = generateEnergyReading(dominantElement, secondaryElement);
        
        return {
            dominantElement,
            secondaryElement,
            energyReading,
            personalGuidance: generatePersonalGuidance(),
            mysticNumbers: generateMysticNumbers(),
            elementalBalance: activeElements,
            timestamp: new Date()
        };
    };

    const findDominantElement = () => {
        if (!activeElements || Object.keys(activeElements).length === 0) {
            return mysticElements[Math.floor(Math.random() * mysticElements.length)];
        }
        
        const maxWeight = Math.max(...Object.values(activeElements));
        const dominantElementId = Object.keys(activeElements).find(key => activeElements[key] === maxWeight);
        return mysticElements.find(el => el.id === dominantElementId);
    };

    const findSecondaryElement = () => {
        const sorted = Object.entries(activeElements || {})
            .sort(([,a], [,b]) => b - a)
            .slice(1, 2);
        
        if (sorted.length > 0) {
            return mysticElements.find(el => el.id === sorted[0][0]);
        }
        return mysticElements[Math.floor(Math.random() * mysticElements.length)];
    };

    const generateEnergyReading = (primary, secondary) => {
        const energyTypes = {
            fire: 'Ваша энергия направлена на действие и лидерство',
            water: 'Ваши эмоции и интуиция ведут вас вперед',
            earth: 'Вы находите силу в стабильности и практичности',
            air: 'Ваш ум и общение открывают новые возможности',
            spirit: 'Духовная мудрость освещает ваш путь',
            moon: 'Циклические изменения приносят гармонию',
            sun: 'Солнечная энергия дает вам силу и уверенность',
            star: 'Звездная судьба ведет к вашему предназначению'
        };
        
        return {
            primary: energyTypes[primary.id] || 'Энергия в состоянии трансформации',
            secondary: energyTypes[secondary.id] || 'Поддерживающая энергия',
            balance: `Баланс между ${primary.energy.toLowerCase()} и ${secondary.energy.toLowerCase()} создает уникальную силу`
        };
    };

    const generatePersonalGuidance = () => {
        const guidanceMessages = [
            'Доверьтесь своей интуиции в принятии важных решений',
            'Время для внутренних трансформаций уже наступило',
            'Ваша энергия находится в гармонии с космическими циклами',
            'Откройтесь новым возможностям, которые появятся вскоре',
            'Баланс между духовным и материальным принесет успех',
            'Ваше предназначение связано с помощью другим людям',
            'Творческая энергия достигает своего пика'
        ];
        
        return guidanceMessages[Math.floor(Math.random() * guidanceMessages.length)];
    };

    const generateMysticNumbers = () => {
        if (!userBirthDate) {
            return [Math.floor(Math.random() * 9) + 1, Math.floor(Math.random() * 9) + 1];
        }
        
        const lifePathNumber = calculateLifePathNumber(userBirthDate);
        const secondNumber = (lifePathNumber + new Date().getDate()) % 9 + 1;
        
        return [lifePathNumber, secondNumber];
    };

    const resetCircle = () => {
        setIsActive(false);
        setMysticData(null);
        setIsLoading(false);
        
        // Убираем активные классы
        mysticElements.forEach(element => {
            const elementDiv = document.getElementById(`element-${element.id}`);
            if (elementDiv) {
                elementDiv.classList.remove('mystic-element--active');
            }
        });
    };

    return (
        <div className="mystic-circle">
            <div className="mystic-circle__container" ref={circleRef}>
                
                {/* Основной круг */}
                <div className={`mystic-circle__main ${isActive ? 'mystic-circle__main--active' : ''}`}>
                    
                    {/* Центральный элемент */}
                    <div className="mystic-circle__center">
                        {isLoading ? (
                            <div className="mystic-circle__loading">
                                <div className="loading-symbol">🔮</div>
                                <p>Считываю энергию...</p>
                            </div>
                        ) : mysticData ? (
                            <div className="mystic-circle__result">
                                <div className="dominant-elements">
                                    <span className="primary-element">
                                        {mysticData.dominantElement?.symbol}
                                    </span>
                                    <span className="secondary-element">
                                        {mysticData.secondaryElement?.symbol}
                                    </span>
                                </div>
                                <p className="energy-name">
                                    {mysticData.dominantElement?.energy}
                                </p>
                            </div>
                        ) : (
                            <div className="mystic-circle__inactive">
                                <div className="circle-symbol">🔮</div>
                                <p>Коснитесь круга</p>
                            </div>
                        )}
                    </div>
                    
                    {/* Элементы по кругу */}
                    {mysticElements.map((element, index) => {
                        const angle = (index * 360) / mysticElements.length;
                        const weight = activeElements[element.id] || 0;
                        
                        return (
                            <div
                                key={element.id}
                                id={`element-${element.id}`}
                                className="mystic-element"
                                style={{
                                    transform: `rotate(${angle}deg) translateY(-120px) rotate(-${angle}deg)`,
                                    '--element-color': element.color,
                                    '--weight': weight
                                }}
                            >
                                <div className="element-symbol">{element.symbol}</div>
                                <div className="element-name">{element.name}</div>
                                {weight > 0 && (
                                    <div className="element-weight">{weight}</div>
                                )}
                            </div>
                        );
                    })}
                </div>
                
                {/* Кнопки управления */}
                <div className="mystic-circle__controls">
                    {!isActive && !mysticData && (
                        <Button 
                            onClick={activateMysticCircle}
                            disabled={isLoading}
                            variant="primary"
                            size="large"
                            className="activate-button"
                        >
                            🔮 Активировать круг
                        </Button>
                    )}
                    
                    {mysticData && (
                        <div className="circle-actions">
                            <Button 
                                onClick={resetCircle}
                                variant="outline"
                            >
                                🔄 Новое чтение
                            </Button>
                            <Button 
                                onClick={() => {/* Сохранить результат */}}
                                variant="primary"
                            >
                                💾 Сохранить
                            </Button>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Результаты чтения */}
            {mysticData && (
                <div className="mystic-reading">
                    <div className="reading-section">
                        <h4>🌟 Энергетическое чтение</h4>
                        <p className="primary-energy">{mysticData.energyReading.primary}</p>
                        <p className="secondary-energy">{mysticData.energyReading.secondary}</p>
                        <p className="balance-energy">{mysticData.energyReading.balance}</p>
                    </div>
                    
                    <div className="reading-section">
                        <h4>🎯 Персональное руководство</h4>
                        <p className="guidance-text">{mysticData.personalGuidance}</p>
                    </div>
                    
                    <div className="reading-section">
                        <h4>🔢 Мистические числа</h4>
                        <div className="mystic-numbers">
                            {mysticData.mysticNumbers.map((number, index) => (
                                <div key={index} className="mystic-number">
                                    <span className="number">{number}</span>
                                    <span className="number-meaning">
                                        {NUMEROLOGY_NUMBERS[number]?.keywords[0] || 'Тайна'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MysticCircle;