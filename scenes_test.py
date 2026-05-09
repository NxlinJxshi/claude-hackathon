from manim import *


class GeneratedScene(Scene):
    def construct(self):
        # Title
        title = Text("The Derivative", font_size=40, color=BLUE).to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # Definition formula
        formula = MathTex(
            r"f'(c)", r"=", r"\lim_{h \to 0}",
            r"\left[", r"\frac{f(c+h) - f(c)}{h}", r"\right]"
        ).scale(1.0).next_to(title, DOWN, buff=0.5)
        self.play(Write(formula))
        self.wait(1)

        # Highlight components
        self.play(formula[0].animate.set_color(YELLOW))
        deriv_label = Text("slope of tangent line", font_size=24, color=YELLOW).next_to(formula, DOWN)
        self.play(FadeIn(deriv_label))
        self.wait(1)
        self.play(FadeOut(deriv_label))

        self.play(formula[4].animate.set_color(GREEN))
        secant_label = Text("slope of secant line", font_size=24, color=GREEN).next_to(formula, DOWN)
        self.play(FadeIn(secant_label))
        self.wait(1)
        self.play(FadeOut(secant_label))

        self.play(formula[2].animate.set_color(RED))
        limit_label = Text("as h shrinks to 0", font_size=24, color=RED).next_to(formula, DOWN)
        self.play(FadeIn(limit_label))
        self.wait(1)
        self.play(FadeOut(limit_label))

        # Move formula up and create axes
        self.play(formula.animate.scale(0.7).to_edge(UP, buff=1.2),
                  FadeOut(title))

        axes = Axes(
            x_range=[-0.5, 4, 1],
            y_range=[-0.5, 5, 1],
            x_length=6,
            y_length=4,
            axis_config={"color": WHITE},
        ).to_edge(DOWN, buff=0.3)

        func = lambda x: 0.4 * x ** 2
        graph = axes.plot(func, x_range=[0, 3.5], color=BLUE)
        graph_label = MathTex("y = f(x)", color=BLUE).scale(0.7).next_to(graph, UR, buff=-0.3)

        self.play(Create(axes), Create(graph), Write(graph_label))
        self.wait(0.5)

        # Point c
        c_val = 1.5
        c_point = Dot(axes.c2p(c_val, func(c_val)), color=YELLOW)
        c_label = MathTex("(c, f(c))", color=YELLOW).scale(0.5).next_to(c_point, DL, buff=0.1)
        self.play(FadeIn(c_point), Write(c_label))

        # h tracker
        h_tracker = ValueTracker(1.5)

        def get_second_point():
            h = h_tracker.get_value()
            return Dot(axes.c2p(c_val + h, func(c_val + h)), color=GREEN)

        def get_secant():
            h = h_tracker.get_value()
            x1, y1 = c_val, func(c_val)
            x2, y2 = c_val + h, func(c_val + h)
            slope = (y2 - y1) / (x2 - x1)
            line = Line(
                axes.c2p(0, y1 - slope * x1),
                axes.c2p(3.8, y1 + slope * (3.8 - x1)),
                color=GREEN
            )
            return line

        second_point = always_redraw(get_second_point)
        secant_line = always_redraw(get_secant)

        h_label = MathTex("(c+h, f(c+h))", color=GREEN).scale(0.5)
        h_label.add_updater(lambda m: m.next_to(second_point, UR, buff=0.05))

        self.add(secant_line, second_point, h_label)
        self.play(FadeIn(secant_line), FadeIn(second_point))
        self.wait(0.5)

        # Shrink h
        self.play(h_tracker.animate.set_value(0.8), run_time=2)
        self.play(h_tracker.animate.set_value(0.3), run_time=2)
        self.play(h_tracker.animate.set_value(0.05), run_time=2)

        # Tangent line appears
        tangent_label = Text("tangent line!", font_size=24, color=YELLOW).to_edge(RIGHT).shift(DOWN)
        self.play(FadeIn(tangent_label))
        self.wait(2)

        # Example
        example = MathTex(r"f(x) = 0.4x^2 \implies f'(c) = 0.8c", color=WHITE).scale(0.7)
        example.next_to(formula, DOWN, buff=0.2)
        self.play(Write(example))
        self.wait(2)
