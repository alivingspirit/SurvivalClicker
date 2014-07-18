var _ = _ || {};
var numeral = numeral || {};

var globals = {
    intervalLength: 50,
    clicksPerClick: 1,
    formatNumber: function( num ){ return numeral(num).format('0.00a') }
}
globals.intervalsToASecond = 1000 / globals.intervalLength

function Element(name, data){
    var self = this;
    this.name = name;
    this.id = Element.indexCount;
    _.extend(this, data);
    this.value = this.startValue;
    
    Element.indexCount++;
    
    Element.elementLookupByName[name] = this;
    Element.elementLookupById[this.id] = this;
    
    this.div = $("<div class='col-md-2'>");
    this.nameDiv = $("<div>").html(this.name);
    this.valueDiv = $("<div>").html(globals.formatNumber(self.value));
    
    this.stepUpdate = function(){
        var canGetSome = _.every(self.rewards, function(reward){
            return reward.element.value + ( ( reward.amount / globals.intervalsToASecond ) * self.value ) >= 0;
        });
        if(canGetSome){
            _.each(self.rewards, function(reward){
                return reward.element.changeValueBy( ( reward.amount / globals.intervalsToASecond ) * self.value);
            });
        }
    }
    
    this.canClickCheck = function(numOfClicks){
        return _.every(self.dependencies, function(dependency){
                    return dependency.element.value + dependency.cost * numOfClicks >= 0;
                });
    };
    
    this.click = function(numOfClicks){
        _.each(self.dependencies, function(dependency){
            return dependency.element.changeValueBy(dependency.cost * numOfClicks);
        });
        self.changeValueBy(numOfClicks);
    };
    
    this.disable = function(){
        self.button.addClass('disabled');
    };
    
    this.enable = function(){
        self.button.removeClass('disabled');
    };
    
    this.button = $("<button class='btn btn-default btn-block'>")
        .append(this.valueDiv)
        .append(this.nameDiv)
        .appendTo(this.div)
        .click(function(){
            if(self.canClickCheck(globals.clicksPerClick)){
                self.click(globals.clicksPerClick);
            }
            else{
                self.disable();
            }
        });
}

Element.indexCount = 0;
Element.elementLookupByName = {};
Element.elementLookupById = {};

Element.prototype.startValue = 0;
Element.prototype.dependencies = [];
Element.prototype.rewards = [];
Element.prototype.render = function(){
    this.valueDiv.html(globals.formatNumber(this.value));
};
Element.prototype.changeValueBy = function( num ){
        this.value += num;
        this.render();
};


function Dependency(elementName, visualizeValue, cost){
    this.elementName = elementName;
    this.visualizeValue = visualizeValue;
    this.cost = cost;
}

function Reward(elementName, amount){
    this.elementName = elementName;
    this.amount = amount;
}

Dependency.prototype.name = "";
Object.defineProperty(Dependency.prototype, "element", {
    get: function(){ return Element.elementLookupByName[this.elementName]; }
})

Object.defineProperty(Reward.prototype, "element", {
    get: function(){ return Element.elementLookupByName[this.elementName]; }
})

var mainModule = function(){
    var module = this;
    this.elements = [
        new Element("Population", {
            startValue: 1
        }),
        new Element("Water"),
        new Element("Food"),
        new Element("Air"),
        new Element("Tree", 
            { 
                dependencies:[
                    new Dependency("Population", 1, -10), 
                    new Dependency("Water", 1, -10)
                ],
                rewards:[
                    new Reward("Air", 1, 10 )
                ] 
            }
        ),
        new Element("Wood",
            { dependencies:[new Dependency("Tree", 1, -1)] })
    ];
    
    this.step = function(){
        _.each(module.elements, function(element){
            element.stepUpdate();
        });
        _.each(module.elements, function(element){
            if(element.canClickCheck(globals.clicksPerClick)){
                element.enable();
            }
            else{
                element.disable();
            }
        });
    };
        
    $(function(){
        var elementsContainer = $("#level1");
        _.each(module.elements, function(element){
            elementsContainer.append(element.div);
        });
        
        module.intervalID = setInterval(module.step, globals.intervalLength);
    });
    
    return this;    
}();

