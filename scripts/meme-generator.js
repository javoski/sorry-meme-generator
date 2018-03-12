;(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
      define([], factory)
  } else if (typeof exports === 'object') {
      module.exports = factory()
  } else {
      root.MemeGenerator = factory()
  }
}(this, function () {
  
  var DOM = {
    query: function (selector, context) {
      context = context || document
      return context.querySelector(selector)
    },
    create: function (tagName) {
      return document.createElement(tagName)
    }
  }

  function canvas2Image (canvas) {
    var $img = DOM.create('img')
    $img.src = canvas.toDataURL()
    return $img
  }

  function meme (data) {
    generateForm(data.texts)
    var width, height, x, y, text = '', ctx, currentFrame = 0
    var oneFramePeriod = data.period / data.totalFrame
    var texts = data.texts
    var frameIndexes = Array(data.totalFrame)
    for (var i = 0, index = 0; i < data.totalFrame; i++) {
      var duration = i * oneFramePeriod
      if (index < texts.length && duration >= texts[index].start) {
        frameIndexes[i] = index
        if (duration > texts[index].end) {
          index++
        }
      } else {
        frameIndexes[i] = -1
      }
    }
    var superGif = new SuperGif({
      gif: document.querySelector('#gif'),
      on_step: onStep,
      on_end: onEnd,
      progressbar_height: 10,
      progressbar_background_color: 'rgba(255, 255, 255, 0.5)',
      progressbar_foreground_color: '#41b882'
    })

    function onStep (ctx) {
      var index = frameIndexes[currentFrame]
      var text = ''
      if (index !== -1 && index < texts.length) {
        text = texts[index].text
      }
      ctx.font = 'normal bolder 16px arial'
      ctx.strokeStyle = '#000000'
      ctx.strokeText(text, x, y)
      ctx.font = 'normal lighter 16px arial'
      ctx.fillStyle = '#ffffff'
      ctx.fillText(text, x, y)
      ctx.textAlign = 'center'
      currentFrame++
    }
    function onEnd () {
      currentFrame = 0
    }
    function onLoaded () {
      var canvas = superGif.get_canvas()
      ctx = canvas.getContext('2d')
      width = canvas.width
      height = canvas.height
      x = width / 2
      y = height - 12
    }

    superGif.load(onLoaded)

    function generateGif (finish) {
      var gif = new GIF({
        workers: 2,
        workerScript: './scripts/libs/gif.worker.js'
      })
      currentFrame = 0
      for (var i = 0; i < data.totalFrame; i++) {
        superGif.move_to(i)
        gif.addFrame(superGif.get_canvas(), {
          copy: true,
          delay: oneFramePeriod
        })
      }
      currentFrame = 0
      superGif.move_to(0)
      gif.render()
      gif.on('finished', function (blob) {
        console.log(blob.size)
        var url = URL.createObjectURL(blob)
        finish(url)
      })
    }
    
    function onInput (index, value) {
      SORRY.texts[index].text = value
    }

    function generateForm (texts) {
      var $form = DOM.query('.form')
      // perf: fragment that contains input list
      var $fragment = document.createDocumentFragment()
      for (var i = 0; i < texts.length; i++) {
        $fragment.appendChild(createInputField(i))
      }
      $form.appendChild($fragment)
      // gif wrapper after generated
      var $gifWrapper = DOM.create('div')
      $gifWrapper.className = 'gif-wrapper'
      $gifWrapper.innerHTML = '<label>已生成！右键保存</label>'
      var $gif = DOM.create('img')
      $gifWrapper.appendChild($gif)
      $form.appendChild($gifWrapper)
      // button
      var $btnWrapper = DOM.create('div')
      $btnWrapper.className = 'input-control'
      var $button = DOM.create('button')
      $button.className = 'btn'
      $button.textContent = '生成表情包'
      
      $button.addEventListener('click', function (evt) {
        $button.textContent = '正在生成中'
        $button.disabled = true
        evt.preventDefault()
        generateGif(function (url) {
          $button.textContent = '生成表情包'
          $button.disabled = false
          $gif.src = url
          $gif.onload = function () {
            $gifWrapper.style.display = 'block'
          }
        })
      })
      $btnWrapper.appendChild($button)
      $form.appendChild($btnWrapper)

      $form.addEventListener('input', function (evt) {
        var target = evt.target
        if (target.tagName === 'INPUT') {
          onInput(target.getAttribute('data-index'), target.value)
        }
      })
      function createInputField (index) {
        var $wrapper = DOM.create('div')
        $wrapper.className = 'input-control'
        var $label = DOM.create('label')
        $label.textContent = '第' + index + '句'
        var $input = DOM.create('input')
        $input.setAttribute('type', 'text')
        $input.setAttribute('data-index', index)
        $input.value = texts[index].text
        $wrapper.appendChild($label)
        $wrapper.appendChild($input)
        $input.addEventListener('focus', function (e) {
         e.target.select()
        })
        return $wrapper
      }
    }
  }
  return meme
}))