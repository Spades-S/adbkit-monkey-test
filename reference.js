    (function() {
        var slots = []
        var slotted = Object.create(null)
        var fingers = []
        var seq = -1
        var cycle = 100
        var fakePinch = false
        var lastPossiblyBuggyMouseUpEvent = 0

        function nextSeq() {
          return ++seq >= cycle ? (seq = 0) : seq
        }

        function createSlots() {
          // The reverse order is important because slots and fingers are in
          // opposite sort order. Anyway don't change anything here unless
          // you understand what it does and why.
          for (var i = 9; i >= 0; --i) {
            var finger = createFinger(i)
            element.append(finger)
            slots.push(i)
            fingers.unshift(finger)
          }
        }

        function activateFinger(index, x, y, pressure) {
          var scale = 0.5 + pressure
          fingers[index].classList.add('active')
          fingers[index].style[cssTransform] =
            'translate3d(' + x + 'px,' + y + 'px,0) ' +
            'scale(' + scale + ',' + scale + ')'
        }

        function deactivateFinger(index) {
          fingers[index].classList.remove('active')
        }

        function deactivateFingers() {
          for (var i = 0, l = fingers.length; i < l; ++i) {
            fingers[i].classList.remove('active')
          }
        }

        function createFinger(index) {
          var el = document.createElement('span')
          el.className = 'finger finger-' + index
          return el
        }

        function calculateBounds() {
          var el = element[0]

          screen.bounds.w = el.offsetWidth
          screen.bounds.h = el.offsetHeight
          screen.bounds.x = 0
          screen.bounds.y = 0

          while (el.offsetParent) {
            screen.bounds.x += el.offsetLeft
            screen.bounds.y += el.offsetTop
            el = el.offsetParent
          }
        }


///////////////////////////////////////////////////////////////
        function mouseDownListener(event) {
          var e = event
          if (e.originalEvent) {
            e = e.originalEvent
          }

          // Skip secondary click
          if (e.which === 3) {
            return
          }

          e.preventDefault()

          fakePinch = e.altKey

          calculateBounds()
          startMousing()

          var x = e.pageX - screen.bounds.x
          var y = e.pageY - screen.bounds.y
          var pressure = 0.5
          var scaled = scaler.coords(
                screen.bounds.w
              , screen.bounds.h
              , x
              , y
              , screen.rotation
              )

          control.touchDown(nextSeq(), 0, scaled.xP, scaled.yP, pressure)

          if (fakePinch) {
            control.touchDown(nextSeq(), 1, 1 - scaled.xP, 1 - scaled.yP,
              pressure)
          }

          control.touchCommit(nextSeq())

          activateFinger(0, x, y, pressure)

          if (fakePinch) {
            activateFinger(1, -e.pageX + screen.bounds.x + screen.bounds.w,
              -e.pageY + screen.bounds.y + screen.bounds.h, pressure)
          }

          element.bind('mousemove', mouseMoveListener)
          $document.bind('mouseup', mouseUpListener)
          $document.bind('mouseleave', mouseUpListener)

          if (lastPossiblyBuggyMouseUpEvent &&
              lastPossiblyBuggyMouseUpEvent.timeStamp > e.timeStamp) {
            // We got mouseup before mousedown. See mouseUpBugWorkaroundListener
            // for details.
            mouseUpListener(lastPossiblyBuggyMouseUpEvent)
          }
          else {
            lastPossiblyBuggyMouseUpEvent = null
          }
        }






////////////////////////////////////////////////////////////////////////
        function mouseMoveListener(event) {
          var e = event
          if (e.originalEvent) {
            e = e.originalEvent
          }

          // Skip secondary click
          if (e.which === 3) {
            return
          }
          e.preventDefault()

          var addGhostFinger = !fakePinch && e.altKey
          var deleteGhostFinger = fakePinch && !e.altKey

          fakePinch = e.altKey

          var x = e.pageX - screen.bounds.x
          var y = e.pageY - screen.bounds.y
          var pressure = 0.5
          var scaled = scaler.coords(
                screen.bounds.w
              , screen.bounds.h
              , x
              , y
              , screen.rotation
              )

          control.touchMove(nextSeq(), 0, scaled.xP, scaled.yP, pressure)

          if (addGhostFinger) {
            control.touchDown(nextSeq(), 1, 1 - scaled.xP, 1 - scaled.yP, pressure)
          }
          else if (deleteGhostFinger) {
            control.touchUp(nextSeq(), 1)
          }
          else if (fakePinch) {
            control.touchMove(nextSeq(), 1, 1 - scaled.xP, 1 - scaled.yP, pressure)
          }

          control.touchCommit(nextSeq())

          activateFinger(0, x, y, pressure)

          if (deleteGhostFinger) {
            deactivateFinger(1)
          }
          else if (fakePinch) {
            activateFinger(1, -e.pageX + screen.bounds.x + screen.bounds.w,
              -e.pageY + screen.bounds.y + screen.bounds.h, pressure)
          }
        }

        function mouseUpListener(event) {
          var e = event
          if (e.originalEvent) {
            e = e.originalEvent
          }

          // Skip secondary click
          if (e.which === 3) {
            return
          }
          e.preventDefault()

          control.touchUp(nextSeq(), 0)

          if (fakePinch) {
            control.touchUp(nextSeq(), 1)
          }

          control.touchCommit(nextSeq())

          deactivateFinger(0)

          if (fakePinch) {
            deactivateFinger(1)
          }

          stopMousing()
        }

        /**
         * Do NOT remove under any circumstances. Currently, in the latest
         * Safari (Version 8.0 (10600.1.25)), if an input field is focused
         * while we do a tap click on an MBP trackpad ("Tap to click" in
         * Settings), it sometimes causes the mouseup event to trigger before
         * the mousedown event (but event.timeStamp will be correct). It
         * doesn't happen in any other browser. The following minimal test
         * case triggers the same behavior (although less frequently). Keep
         * tapping and you'll eventually see see two mouseups in a row with
         * the same counter value followed by a mousedown with a new counter
         * value. Also, when the bug happens, the cursor in the input field
         * stops blinking. It may take up to 300 attempts to spot the bug on
         * a MacBook Pro (Retina, 15-inch, Mid 2014).
         *
         *     <!doctype html>
         *
         *     <div id="touchable"
         *       style="width: 100px; height: 100px; background: green"></div>
         *     <input id="focusable" type="text" />
         *
         *     <script>
         *     var touchable = document.getElementById('touchable')
         *       , focusable = document.getElementById('focusable')
         *       , counter = 0
         *
         *     function mousedownListener(e) {
         *       counter += 1
         *       console.log('mousedown', counter, e, e.timeStamp)
         *       e.preventDefault()
         *     }
         *
         *     function mouseupListener(e) {
         *       e.preventDefault()
         *       console.log('mouseup', counter, e, e.timeStamp)
         *       focusable.focus()
         *     }
         *
         *     touchable.addEventListener('mousedown', mousedownListener, false)
         *     touchable.addEventListener('mouseup', mouseupListener, false)
         *     </script>
         *
         * I believe that the bug is caused by some kind of a race condition
         * in Safari. Using a textarea or a focused contenteditable does not
         * get rid of the bug. The bug also happens if the text field is
         * focused manually by the user (not with .focus()).
         *
         * It also doesn't help if you .blur() before .focus().
         *
         * So basically we'll just have to store the event on mouseup and check
         * if we should do the browser's job in the mousedown handler.
         */
        function mouseUpBugWorkaroundListener(e) {
          lastPossiblyBuggyMouseUpEvent = e
        }

        function startMousing() {
          control.gestureStart(nextSeq())
          input[0].focus()
        }

        function stopMousing() {
          element.unbind('mousemove', mouseMoveListener)
          $document.unbind('mouseup', mouseUpListener)
          $document.unbind('mouseleave', mouseUpListener)
          deactivateFingers()
          control.gestureStop(nextSeq())
        }

        function touchStartListener(event) {
          var e = event
          e.preventDefault()

          //Make it jQuery compatible also
          if (e.originalEvent) {
            e = e.originalEvent
          }

          calculateBounds()

          if (e.touches.length === e.changedTouches.length) {
            startTouching()
          }

          var currentTouches = Object.create(null)
          var i, l

          for (i = 0, l = e.touches.length; i < l; ++i) {
            currentTouches[e.touches[i].identifier] = 1
          }

          function maybeLostTouchEnd(id) {
            return !(id in currentTouches)
          }

          // We might have lost a touchend event due to various edge cases
          // (literally) such as dragging from the bottom of the screen so that
          // the control center appears. If so, let's ask for a reset.
          if (Object.keys(slotted).some(maybeLostTouchEnd)) {
            Object.keys(slotted).forEach(function(id) {
              slots.push(slotted[id])
              delete slotted[id]
            })
            slots.sort().reverse()
            control.touchReset(nextSeq())
            deactivateFingers()
          }

          if (!slots.length) {
            // This should never happen but who knows...
            throw new Error('Ran out of multitouch slots')
          }

          for (i = 0, l = e.changedTouches.length; i < l; ++i) {
            var touch = e.changedTouches[i]
            var slot = slots.pop()
            var x = touch.pageX - screen.bounds.x
            var y = touch.pageY - screen.bounds.y
            var pressure = touch.force || 0.5
            var scaled = scaler.coords(
                  screen.bounds.w
                , screen.bounds.h
                , x
                , y
                , screen.rotation
                )

            slotted[touch.identifier] = slot
            control.touchDown(nextSeq(), slot, scaled.xP, scaled.yP, pressure)
            activateFinger(slot, x, y, pressure)
          }

          element.bind('touchmove', touchMoveListener)
          $document.bind('touchend', touchEndListener)
          $document.bind('touchleave', touchEndListener)

          control.touchCommit(nextSeq())
        }

        function touchMoveListener(event) {
          var e = event
          e.preventDefault()

          if (e.originalEvent) {
            e = e.originalEvent
          }

          for (var i = 0, l = e.changedTouches.length; i < l; ++i) {
            var touch = e.changedTouches[i]
            var slot = slotted[touch.identifier]
            var x = touch.pageX - screen.bounds.x
            var y = touch.pageY - screen.bounds.y
            var pressure = touch.force || 0.5
            var scaled = scaler.coords(
                  screen.bounds.w
                , screen.bounds.h
                , x
                , y
                , screen.rotation
                )

            control.touchMove(nextSeq(), slot, scaled.xP, scaled.yP, pressure)
            activateFinger(slot, x, y, pressure)
          }

          control.touchCommit(nextSeq())
        }

        function touchEndListener(event) {
          var e = event
          if (e.originalEvent) {
            e = e.originalEvent
          }

          var foundAny = false

          for (var i = 0, l = e.changedTouches.length; i < l; ++i) {
            var touch = e.changedTouches[i]
            var slot = slotted[touch.identifier]
            if (typeof slot === 'undefined') {
              // We've already disposed of the contact. We may have gotten a
              // touchend event for the same contact twice.
              continue
            }
            delete slotted[touch.identifier]
            slots.push(slot)
            control.touchUp(nextSeq(), slot)
            deactivateFinger(slot)
            foundAny = true
          }

          if (foundAny) {
            control.touchCommit(nextSeq())
            if (!e.touches.length) {
              stopTouching()
            }
          }
        }

        function startTouching() {
          control.gestureStart(nextSeq())
        }

        function stopTouching() {
          element.unbind('touchmove', touchMoveListener)
          $document.unbind('touchend', touchEndListener)
          $document.unbind('touchleave', touchEndListener)
          deactivateFingers()
          control.gestureStop(nextSeq())
        }

        element.on('touchstart', touchStartListener)
        element.on('mousedown', mouseDownListener)
        element.on('mouseup', mouseUpBugWorkaroundListener)

        createSlots()
      })()