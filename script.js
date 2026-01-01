// Основные функции для RPG калькуляций

class CharacterSheet {
    constructor() {
        this.attributes = {
            strength: 10,
            dexterity: 10,
            constitution: 10,
            intelligence: 10,
            wisdom: 10,
            charisma: 10
        };
    }

    // Расчет модификатора характеристики
    calculateModifier(score) {
        return Math.floor((score - 10) / 2);
    }

    // Получение всех модификаторов
    getAllModifiers() {
        const modifiers = {};
        for (const [attr, score] of Object.entries(this.attributes)) {
            modifiers[attr] = this.calculateModifier(score);
        }
        return modifiers;
    }

    // Расчет броска спасброска
    calculateSavingThrow(attribute, proficiency = false, proficiencyBonus = 2) {
        const modifier = this.calculateModifier(this.attributes[attribute]);
        return proficiency ? modifier + proficiencyBonus : modifier;
    }
}

// Пример использования
document.addEventListener('DOMContentLoaded', function() {
    console.log('DnD Character Sheets loaded!');
    
    // Создаем демо-персонажа
    const demoCharacter = new CharacterSheet();
    demoCharacter.attributes.strength = 16;
    demoCharacter.attributes.dexterity = 14;
    demoCharacter.attributes.wisdom = 12;
    
    console.log('Демо персонаж создан:');
    console.log('Характеристики:', demoCharacter.attributes);
    console.log('Модификаторы:', demoCharacter.getAllModifiers());
    console.log('Спасбросок Силы (с мастерством):', 
        demoCharacter.calculateSavingThrow('strength', true, 2));
});

// Вспомогательные функции
function rollDice(sides = 20) {
    return Math.floor(Math.random() * sides) + 1;
}

function rollAbilityScore() {
    const rolls = [
        rollDice(6),
        rollDice(6),
        rollDice(6),
        rollDice(6)
    ];
    // Берем три лучших броска
    rolls.sort((a, b) => b - a);
    return rolls[0] + rolls[1] + rolls[2];
}

// Экспортируем функции для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CharacterSheet, rollDice, rollAbilityScore };
}
