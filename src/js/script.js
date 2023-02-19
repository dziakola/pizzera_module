/* global Handlebars, utils */ 
/* eslint-disable no-unused-vars */
{
  'use strict';
  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product', // CODE ADDED
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input.amount', // CODE CHANGED
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    // CODE ADDED START
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
    // CODE ADDED END
  };
  
  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    // CODE ADDED START
    cart: {
      wrapperActive: 'active',
    },
    // CODE ADDED END
  };
  
  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    }, // CODE CHANGED
    // CODE ADDED START
    cart: {
      defaultDeliveryFee: 20,
    },
    db: {
      url: '//localhost:3131',
      products: 'products',
      orders: 'orders',
    },
    // CODE ADDED END
  };
  
  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    // CODE ADDED START
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
    // CODE ADDED END
  };
  class Product {
    constructor(id, data){
      const thisProduct = this;
      thisProduct.id = id;
      thisProduct.data = data;
      thisProduct.renderInMenu();
      thisProduct.getElements();     
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();
    }
    renderInMenu(){
      const thisProduct = this;
      /*wygenerowanie html za pomocą szablonów*/
      const generateHtml = templates.menuProduct(thisProduct.data);
      /* utworzenie elementu DOM z generateHtml */
      thisProduct.element = utils.createDOMFromHTML(generateHtml);
      /* odnalezienie kontenera produktów */
      const menuContainer = document.querySelector(select.containerOf.menu);
      /*dodajemy element do menu */
      menuContainer.appendChild(thisProduct.element);
    }
    getElements(){
      /*elementów szukamy zawsze w pojedynczym produkcie, nie całym elemencie*/
      const thisProduct = this;
      /*thisProduct.element - to każdy kolejny produkt, zawierający dane o selektorze*/
      thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
      thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
      thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
      thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
      /*selektor do diva z inputem i buttonami*/
      thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
    }
    initAccordion(){
      const thisProduct = this;
      /* find the clickable trigger (the element that should react to clicking) */
      /* START: add event listener to clickable trigger on event click */
      thisProduct.accordionTrigger.addEventListener('click', function(event) {
        event.preventDefault();
        /* find active product (product that has active class) */
        const activeProduct = document.querySelector(select.all.menuProductsActive);
        /* if there is active product and it's not thisProduct.element, remove class active from it */
        if((activeProduct) && activeProduct !== thisProduct.element){
          activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
        } //else w tym momencie powoduje ze sa tylko 2 opcje
        /* toggle active class on thisProduct.element */
        thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
      });
    }
    initOrderForm(){
      const thisProduct = this;
      thisProduct.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisProduct.processOrder();
      });
      
      for(let input of thisProduct.formInputs){
        input.addEventListener('change', function(){
          thisProduct.processOrder();
        });
      }
      
      thisProduct.cartButton.addEventListener('click', function(event){
        event.preventDefault();
        thisProduct.processOrder();
        thisProduct.addToCart();
      });
    }
    processOrder(){
      const thisProduct = this;
      // covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
      const formData = utils.serializeFormToObject(thisProduct.form);
      // set price to default price
      let price = thisProduct.data.price;
      // for every category (param)...
      for(let paramId in thisProduct.data.params) {
      // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
        const param = thisProduct.data.params[paramId];
        
        // for every option in this category
        for(let optionId in param.options) {
        // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
          const option = param.options[optionId];
          const optImg = thisProduct.imageWrapper.querySelector(`.${paramId}-${optionId}`);
          
          if(optImg){           
            optImg.classList.remove('active');           
          }
        
          if(formData[paramId].includes(optionId)){
            if((!option['default'])){
              price = price + option['price'];}
            if(optImg){
              optImg.classList.add('active');
            }
          }
          if(!formData[paramId].includes(optionId)){
            if((option['default'])){
              price = price - option['price'];
            }
            if(optImg){
              optImg.classList.remove('active');
            }
          } 
        }
      }
      // update calculated price in the HTML
      price *= thisProduct.amountWidget.value;
      thisProduct.priceElem.innerHTML = price;
      thisProduct.priceSingle = price;
    }
    prepareCartProductParams(){
      const thisProduct = this;
      // covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
      const formData = utils.serializeFormToObject(thisProduct.form);
      const params ={};
      // for every category (param)...
      for(let paramId in thisProduct.data.params) {
        // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
        const param = thisProduct.data.params[paramId];
        params[paramId] = {
          label: param.label,
          options:{
          }
        };
        for(let optionId in param.options) {
        // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
          const option = param.options[optionId];
          /*sprawdzenie czy opcje są wybrane*/
          if(formData[paramId] && formData[paramId].includes(optionId)){
            params[paramId].options[optionId] = option.label; 
          }
        }   
      }
      /*stworzenie obiektu z podsumowaniem*/
      return params; 
    }    
    initAmountWidget(){
      const thisProduct = this;
      thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
      thisProduct.amountWidgetElem.addEventListener('updated', function(){
        thisProduct.processOrder();
      });     
    }
    prepareCartProduct(){
      const thisProduct = this;
      const productSummary = {
        id:thisProduct.id,
        name:thisProduct.data.name,
        amount:thisProduct.amountWidget.value,
        priceSingle:thisProduct.data.price,
        price:thisProduct.priceSingle,
        params: thisProduct.prepareCartProductParams(),
      };
      return productSummary;
    }
    addToCart(){
      const thisProduct = this;
      /*metoda add klasy Cart*/
      /*przekazanie obiektu productSummary*/
      app.cart.add(thisProduct.prepareCartProduct());
    }
    
  }
  
  class AmountWidget {
    /*element = referencja do diva z inputem i buttonami*/
    constructor(element){
      const thisWidget = this;
      thisWidget.getElements(element);
      thisWidget.setValue(thisWidget.input.value||settings.amountWidget.defaultValue);
      thisWidget.initActions();
    }
    getElements(element){
      const thisWidget = this;
    
      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
    }
    setValue(value){
      const thisWidget = this;
      const newValue = parseInt(value);
      /*dodanie walidacji*/
      /*zapisanie przekazanego argumentu do value*/
      if(!isNaN(newValue) && thisWidget.value!==newValue && (newValue >= settings.amountWidget.defaultMin && newValue <= settings.amountWidget.defaultMax)){
        thisWidget.value = newValue;
        /*aktualizacja wartości inputu*/
        thisWidget.input.value = thisWidget.value;
        thisWidget.announce();
      }
      thisWidget.input.value = thisWidget.value;
    }
    initActions(){
      const thisWidget = this;
      thisWidget.input.addEventListener('change', function(){
        thisWidget.setValue(thisWidget.input.value);
      });
      thisWidget.linkDecrease.addEventListener('click', function(event){
        event.preventDefault();
        thisWidget.setValue(thisWidget.value - 1);
      } );
      thisWidget.linkIncrease.addEventListener('click', function(event){
        event.preventDefault();
        thisWidget.setValue(thisWidget.value +  1);
      });
    }
    announce(){
      const thisWidget = this;
      const event = new CustomEvent('updated', {bubbles:true});
      thisWidget.element.dispatchEvent(event);
    }
  }
  class Cart {
    constructor(element){
      const thisCart = this;
      /*elementy dodane do koszyka*/
      thisCart.products = [];
      thisCart.getElements(element);
      thisCart.initActions();
      
    }
    getElements(element){
      const thisCart = this;
      thisCart.dom = {};
      thisCart.dom.wrapper = element;
      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
      thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
      thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
      thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
      thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelectorAll(select.cart.totalPrice);
      thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
      thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
      console.log(thisCart.dom.form);
      
      thisCart.dom.address = thisCart.dom.form.querySelector(select.cart.address);
      thisCart.dom.phone = thisCart.dom.form.querySelector(select.cart.phone);
      console.log(thisCart.dom.form.address);
      

    }
    initActions(){
      const thisCart = this;
      /*akcja wywołana na górnej belce koszyka*/
      thisCart.dom.toggleTrigger.addEventListener('click', function(){
        /*toggle na klasie active kontenera cart*/
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      });
      thisCart.dom.productList.addEventListener('updated', function(){thisCart.update();});
      thisCart.dom.productList.addEventListener('remove', function(){thisCart.remove(event.detail.cartProduct);});
      thisCart.dom.form.addEventListener('submit', function(e){
        e.preventDefault();
        thisCart.sendOrder();
      });
    }
    add(menuProduct){
      const thisCart = this;
      /*wygenerowanie html za pomocą szablonów, argumentem jest obiekt */
      const generateHtml = templates.cartProduct(menuProduct);
      /* utworzenie elementu DOM z generateHtml */
      const generatedDOM = utils.createDOMFromHTML(generateHtml);
      /*dodajemy element do menu */
      thisCart.dom.productList.appendChild(generatedDOM);
      thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
      thisCart.update();
    }
    update(){
      const thisCart = this;
      /*koszty dostawy*/
      thisCart.deliveryFee = settings.cart.defaultDeliveryFee;
      /*całkowita liczba zamówień*/
      thisCart.totalNumber = 0;
      /*cena wszystkich produktów*/
      thisCart.subtotalPrice = 0;
      //console.log(thisCart.products);
      //console.log(thisCart.products.amount);
      
      for(let product of thisCart.products){
        thisCart.totalNumber += product.amount;
        thisCart.subtotalPrice += product.price;
      }
      thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;
      thisCart.dom.subtotalPrice.innerHTML = thisCart.subtotalPrice;
      thisCart.totalPrice = 0;
      if(this.products.length>0){
        thisCart.totalPrice = thisCart.subtotalPrice + thisCart.deliveryFee;
        for(let total of thisCart.dom.totalPrice) {total.innerHTML =thisCart.totalPrice; }
        //thisCart.dom.totalPrice.innerHTML = thisCart.totalPrice;
        thisCart.dom.deliveryFee.innerHTML = thisCart.deliveryFee;
      }else{thisCart.dom.deliveryFee.innerHTML = 0;
        for(let total of thisCart.dom.totalPrice) {total.innerHTML =thisCart.totalPrice; }}
      //console.log(`ilosc produktow ${totalNumber} cena z dostawą ${thisCart.totalPrice}, cena wszystkich produktów ${subtotalPrice}`);
      
      
    }
    remove(element){
      const thisCart = this;
      //Usunięcie reprezentacji produktu z HTML-a,
      element.dom.wrapper.remove();
      //Usunięcie informacji o danym produkcie z tablicy thisCart.products.
      thisCart.products.splice((thisCart.products.indexOf(element)),1); 
      //Wywołać metodę update w celu przeliczenia sum po usunięciu produktu.
      
      thisCart.update();
      
    }
    sendOrder(){
      const thisCart = this;
      //adres endpointu, z którym chcemy się połączyć
      const url = settings.db.url + '/' + settings.db.orders;
      const payload = {
        address:thisCart.dom.address.value,
        phone:thisCart.dom.phone.value,
        totalPrice:thisCart.totalPrice,
        subtotalPrice:thisCart.subtotalPrice,
        totalNumber:thisCart.totalNumber,
        deliveryFee:thisCart.deliveryFee,
        products:[],
      };
      for(let prod of thisCart.products) {
        payload.products.push(prod.getData());
      }
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      };
      
      fetch(url, options);
    }
    
  }
  class CartProduct{
    constructor(menuProduct,element){
      const thisCartProduct= this;
      
      thisCartProduct.id = menuProduct.id;
      thisCartProduct.name = menuProduct.name;
      thisCartProduct.amount = menuProduct.amount;
      thisCartProduct.price = menuProduct.price;
      thisCartProduct.priceSingle = menuProduct.priceSingle;
      thisCartProduct.params = menuProduct.params;
      thisCartProduct.getElements(element);
      thisCartProduct.initAmountWidget();
      thisCartProduct.initActions();
    }
    getElements(element){
      const thisCartProduct = this;
      thisCartProduct.dom = {};
      thisCartProduct.dom.wrapper = element;
      thisCartProduct.dom.amountWidget = element.querySelector(select.cartProduct.amountWidget);
      thisCartProduct.dom.price = element.querySelector(select.cartProduct.price);
      thisCartProduct.dom.edit = element.querySelector(select.cartProduct.edit);
      thisCartProduct.dom.remove = element.querySelector(select.cartProduct.remove);
    }
    initAmountWidget(){
      const thisCartProduct = this;
      thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidget);
      thisCartProduct.dom.amountWidget.addEventListener('updated', function(){
        thisCartProduct.amount = thisCartProduct.amountWidget.value;
        thisCartProduct.price = thisCartProduct.amount * thisCartProduct.priceSingle;
        thisCartProduct.dom.price.innerHTML = thisCartProduct.price;
      });     
    }
    remove(){
      const thisCartProduct = this;
      const event = new CustomEvent('remove', {
        bubbles: true,
        detail: {
          cartProduct: thisCartProduct,
        },
      });
      thisCartProduct.dom.wrapper.dispatchEvent(event);
      
      
    }
    initActions(){
      const thisCartProduct=this;
      thisCartProduct.dom.edit.addEventListener('click', function(){
        event.preventDefault();
      });
      thisCartProduct.dom.remove.addEventListener('click', function(){
        event.preventDefault();
        thisCartProduct.remove();
      });
    }
    getData(){
      const thisCartProduct = this;
      const products= {
        id: thisCartProduct.id,
        amount: thisCartProduct.amount,
        price: thisCartProduct.price,
        priceSingle: thisCartProduct.priceSingle,
        name: thisCartProduct.name,
        params: thisCartProduct.params,
      };
      return products;
    }
  }
  const app = {
    initCart: function(){
      const thisApp = this;
      const cartElem = document.querySelector(select.containerOf.cart);
      /*dostęp do obiektu będzie następował przez app.cart*/
      thisApp.cart = new Cart(cartElem);
    },
    initMenu: function(){
      const thisApp = this;
      for(let productData in thisApp.data.products){
        new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
      }
    },
    //to musi zostać zainicjowane pierwsze
    initData: function(){
      const thisApp = this;
      //tu powstaje referencja do datasource, z której mogą korzystać inne metody obiektu app
      thisApp.data = {};
      const url = settings.db.url + '/' + settings.db.products;
      fetch(url).then(function(rawResponse){
        return rawResponse.json();
      }).then(function(parsedResponse){
        console.log('parsedResponse', parsedResponse); 
        thisApp.data.products = parsedResponse;
        thisApp.initMenu();   
      });
      console.log('thisApp.data', JSON.stringify(thisApp.data));
    },
    init: function(){
      const thisApp = this;
      thisApp.initData();
      thisApp.initCart();
    },
  };
  app.init();
}