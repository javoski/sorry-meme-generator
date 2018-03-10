;(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
      define([], factory)
  } else if (typeof exports === 'object') {
      module.exports = factory()
  } else {
      root.MemeGenerator = factory()
  }
}(this, function () {
  function meme (data) {
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
      generateForm(data.texts)
    }
    superGif.load_url(data.url, onLoaded)
    var $genBtn = document.querySelector('#btn-gen')
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
        finish()
        window.open(URL.createObjectURL(blob))
      })
    }
    
    function onInput (index, value) {
      SORRY.texts[index].text = value
    }

    function generateForm (texts) {
      var $form = document.querySelector('.form')
      var $fragment = document.createDocumentFragment()
      for (var i = 0; i < texts.length; i++) {
        $fragment.appendChild(createInputField(i))
      }
      $form.appendChild($fragment)
      var $btnWrapper = document.createElement('div')
      $btnWrapper.className = 'input-control'
      var $button = document.createElement('button')
      $button.className = 'btn'
      $button.textContent = '生成表情包'
      $button.addEventListener('click', function (evt) {
        $button.textContent = '正在生成中'
        $button.disabled = true
        evt.preventDefault()
        generateGif(function () {
          $button.textContent = '生成表情包'
          $button.disabled = false
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
        var $wrapper = document.createElement('div')
        $wrapper.className = 'input-control'
        var $label = document.createElement('label')
        $label.textContent = '第' + index + '句'
        var $input = document.createElement('input')
        $input.setAttribute('type', 'text')
        $input.setAttribute('data-index', index)
        $input.value = texts[index].text
        $wrapper.appendChild($label)
        $wrapper.appendChild($input)
        return $wrapper
      }
    }
  }
  return meme
}))